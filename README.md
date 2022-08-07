# kysely-orm
TypeSafe ORM for kysely library

# Define Database connection

```ts: ./config/db.ts
import { Database } from 'kysely-orm';

export default new Database({
  connectionString: '...',
});
```

# Define Model

```ts ./models/User.ts
import { Model } from 'kysely-orm';

export default class User extends Model<DB, 'users', 'id'> {
  static bind<DB>(db: Database<DB>) {
    return new User(db, 'users', 'id');
  }

  findByEmail(email: string) {
    return this.findOne('email', email);
  }
}
```

# Connect Models to specific database

```ts ./models/index.ts
import db from '../config/db';
import UserClass from './User';
import PostClass from './Post';

export const User = new UserClass(db, 'users', 'id'); // or use your const User = UserClass.bind(db);
export const Post = new PostClass(db, 'posts', 'uuid');
```

# Define service

```ts ./services/user.ts
import { User } from '../models';

async function createUser(data) {
  const { email } = data;
  const user = await User.findByEmail(email);
  if (user) {
    throw new Error('User already exists');
  }

  ...
}
```

# Transactions

```ts 
import { User, Post } from '../models';

async function createUser(data) {
  const newUser = User.transaction(async () => {
    const user = await User.findByEmail(email);
    if (user) {
      throw new Error('User already exists');
    }

    return User.insert(data);
  });

  ...
}
```

How is it working?
Transactions are using node AsyncLocalStorage whitch is stable node feature.
Therefore you do not need to pass any transaction object to your current models.
Everything working out of the box.

### Use db.transaction instead of Model.transaction
Model.transaction is alias for db.transaction

```ts
import db from '../config/db';
import { User, Post } from '../models';

async function createUser(data) {
  const newUser = db.transaction(async () => {
    const user = await User.findByEmail(email);
    if (user) {
      throw new Error('User already exists');
    }

    return User.insert(data);
  });

  ...
}
```

### How to use multiple transactions

Working with multiple models and different transactions is not an easy task. For this purpose you can use

```ts
import { User, Post } from '../models';

async function createUsers(userData1, userData2) {
  const [user1, user2] = await Promise.all([
    User.transaction(() => User.insert(userData1)),
    User.transaction(() => User.insert(userData2)),
  ]);
  ...
}
```

### The afterCommit hook

A transaction object allows tracking if and when it is committed.

An afterCommit hook can be added to both managed and unmanaged transaction objects:

```ts 
import { User, Post } from '../models';

async function createUser(data) {
  const newUser = User.transaction(async ({ afterCommit }) => {
    const user = await User.findByEmail(email);
    if (user) {
      throw new Error('User already exists');
    }

    const user = await User.insert(data);

    afterCommit(async () => {
      await notifyUser(user);
    });

    ...

    return user;
  });

  ...
}
```

The callback passed to afterCommit can be async. In this case transaction call will wait for it before settling.

The afterCommit hook is not raised if the transaction is rolled back.
The afterCommit hook does not modify the return value of the transaction.

# Requests and models/transactions isolation

For each http request, you should create a new isolated model instance (best security practice). Here is an example of how to do that.

```ts
import { User } from '../models';

const IsolatedUserModel = User.isolate();
```

For example why to use it: 
1. when your model is using dataloaders
2. when your model is storing data and using it later

# Plugins

Sometimes you want to use same logic across your models. For example automatically set upadatedAt when you update row data.
Here is example how to define model which has support for plugins.

```ts 
import { applyPlugins, updatedAt, slug } from 'kysely-orm';
import type DB from './@types/DB';

export default class User extends applyPlugins<DB, 'users', 'id'>(Model, 'users', 'id', [
  updatedAt,
  slug({
    field: 'username',
    sources: ['name', 'firstName', 'lastName'],
    slugOptions: {
      truncate: 15,
    },
  }),
]) {
  findByEmail(email: string) {
    return this.findOne('email', email);
  }
}
```

## Plugin updatedAt

It will set your db field to NOW() during any update

```ts 
import { applyPlugins, updatedAt } from 'kysely-orm';
import type DB from './@types/DB';

export default class User extends applyPlugins<DB, 'users', 'id'>(Model, 'users', 'id', [
  updatedAt('updatedAt'),
]) {
  findByEmail(email: string) {
    return this.findOne('email', email);
  }
}
```

## Plugin slug

It will automatically compute url slug from your data and use it during db insert

```ts 
import { applyPlugins, slug } from 'kysely-orm';
import type DB from './@types/DB';

export default class User extends applyPlugins<DB, 'users', 'id'>(Model, 'users', 'id', [
  slug({
    field: 'slug',
    sources: ['name', 'firstName', 'lastName'],
    slugOptions: {
      truncate: 15,
    },
  }),
]) {
  findByEmail(email: string) {
    return this.findOne('email', email);
  }
}
```

# Standard Model functions

```ts
export default class Model<DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string> extends ModelBase<DB> {
  readonly table: TableName;
  readonly id: IdColumnName;

  constructor(db: Database<DB>, table: TableName, id: IdColumnName) {
    super(db);

    this.table = table;
    this.id = id;
  }

  async beforeInsert(data: Insertable<DB[TableName]>) {
    return data;
  }

  async beforeUpdate(data: Updateable<InsertObject<DB, TableName>>) {
    return data;
  }

  isolate() {
    return new (this.constructor as typeof Model)(this.db, this.table, this.id);
  }

  transaction<Type>(callback: TransactionCallback<DB, Type>) {
    return this.db.transaction(callback);
  }

  find<ColumnName extends keyof DB[TableName] & string>(
    column: ColumnName,
    values: SelectType<DB[TableName][ColumnName]>[],
  ) {
    return this.db
      .selectFrom(this.table)
      .where(this.db.dynamic.ref(column as string), 'in', values)
      .selectAll()
      .limit(1)
      .execute();
  }

  findOne<ColumnName extends keyof DB[TableName] & string>(
    column: ColumnName,
    value: SelectType<DB[TableName][ColumnName]>,
  ) {
    return this.db
      .selectFrom(this.table)
      .where(this.db.dynamic.ref(column as string), '=', value)
      .selectAll()
      .limit(1)
      .executeTakeFirst();
  }

  findById(id: SelectType<DB[TableName][IdColumnName]>) {
    return this.findOne(this.id, id);
  }

  findByIds(ids: SelectType<DB[TableName][IdColumnName]>[]) {
    return this.find(this.id, ids);
  }

  getOne<ColumnName extends keyof DB[TableName] & string>(
    column: ColumnName,
    value: SelectType<DB[TableName][ColumnName]>,
    error: typeof NoResultError = NoResultError,
  ) {
    return this.db
      .selectFrom(this.table)
      .where(this.db.dynamic.ref(column as string), '=', value)
      .selectAll()
      .limit(1)
      .executeTakeFirstOrThrow(error);
  }

  getById(id: SelectType<DB[TableName][IdColumnName]>) {
    return this.getOne(this.id, id);
  }
  
  async findOneAndUpdate<ColumnName extends keyof DB[TableName] & string>(
    column: ColumnName,
    value: SelectType<DB[TableName][ColumnName]>,
    data: Updateable<InsertObject<DB, TableName>>,
  ) {
    const processedData = await this.beforeUpdate(data);

    return this.db
      .updateTable(this.table)
      .where(this.db.dynamic.ref(column as string), '=', value)
      .set(processedData)
      .returningAll()
      .executeTakeFirst();
  }

  findByIdAndUpdate(id: SelectType<DB[TableName][IdColumnName]>, data: Updateable<InsertObject<DB, TableName>>) {
    return this.findOneAndUpdate(this.id, id, data);
  }
  
  async getOneAndUpdate<ColumnName extends keyof DB[TableName] & string>(
    column: ColumnName,
    value: SelectType<DB[TableName][ColumnName]>,
    data: Updateable<InsertObject<DB, TableName>>,
    error: typeof NoResultError = NoResultError,
  ) {
    const processedData = await this.beforeUpdate(data);

    return this.db
      .updateTable(this.table)
      .where(this.db.dynamic.ref(column as string), '=', value)
      .set(processedData)
      .returningAll()
      .executeTakeFirstOrThrow(error);
  }

  getByIdAndUpdate(id: SelectType<DB[TableName][IdColumnName]>, data: Updateable<InsertObject<DB, TableName>>) {
    return this.getOneAndUpdate(this.id, id, data);
  }
  
  lock<ColumnName extends keyof DB[TableName] & string>(
    column: ColumnName,
    value: SelectType<DB[TableName][ColumnName]>,
  ) {
    return this.db
      .selectFrom(this.table)
      .where(this.db.dynamic.ref(column as string), '=', value)
      .selectAll()
      .forUpdate()
      .executeTakeFirst();
  }

  lockById(id: SelectType<DB[TableName][IdColumnName]>) {
    return this.lock(this.id, id);
  }
  
  async insert(
    values: Insertable<DB[TableName]>,
    error: typeof NoResultError = NoResultError,
  ) {
    const processedValues = await this.beforeInsert(values);

    return this.db
      .insertInto(this.table)
      .values(processedValues)
      .returningAll()
      .executeTakeFirstOrThrow(error);
  }
  
  async deleteOne<ColumnName extends keyof DB[TableName] & string>(
    column: ColumnName,
    value: SelectType<DB[TableName][ColumnName]>,
    error: typeof NoResultError = NoResultError,
  ) {
    const { numDeletedRows } = await this.db
      .deleteFrom(this.table)
      .where(this.db.dynamic.ref(column as string), '=', value)
      .executeTakeFirstOrThrow(error);

    return numDeletedRows;
  }

  async deleteMany<ColumnName extends keyof DB[TableName] & string>(
    column: ColumnName,
    values: SelectType<DB[TableName][ColumnName]>[],
    error: typeof NoResultError = NoResultError,
  ) {
    const { numDeletedRows } = await this.db
      .deleteFrom(this.table)
      .where(this.db.dynamic.ref(column as string), 'in', values)
      .executeTakeFirstOrThrow(error);

    return numDeletedRows;
  }

  deleteById(id: SelectType<DB[TableName][IdColumnName]>) {
    return this.deleteOne(this.id, id);
  }
}
```
