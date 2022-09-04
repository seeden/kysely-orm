# kysely-orm
TypeSafe ORM for [kysely library](https://github.com/koskimas/kysely)

# Define TypeSafe DB structure

```ts ./@types/Database
import { type Generated } from 'kysely';

interface Users {
  id: Generated<number>;
  name: string;
  email: string;
}

interface Books {
  id: Generated<number>;
  title: string;
  userId: number;
}

interface DB {
  users: Users;
  books: Books;
};
```

I will recommend using [library kysely-codegen](https://github.com/RobinBlomberg/kysely-codegen) for autogenerating this structure. 

# Define Database connection

```ts: ./config/db.ts
import { Database } from 'kysely-orm';
import type DB from './@types/Database';

export default new Database<DB>({
  connectionString: '...',
});
```

## How to use kysely instance directly

```ts: ./config/db.ts
import { Database } from 'kysely-orm';
import { Kysely } from 'kysely';
import type DB from './@types/Database';

const kysely = new Kysely<DB>(...);

export default new Database({
  kysely,
});
```

# Define Model

```ts ./models/User.ts
import db from './db';

export default class User extends db.model('users', 'id') {
  static findByEmail(email: string) {
    return this.findOne('email', email);
  }
}
```

## Export all models

```ts ./models/index.ts
export { default as User } from './User';
export { default as Book } from './Book';
```

# Transactions

```ts 
import { User, Book } from '../models';

async function createUser(data) {
  const newUser = User.transaction(async () => {
    const user = await User.findByEmail(email); // user instanceof User; === true
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
import { User, Book } from '../models';

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

### AsyncLocalStorage pitfalls

If you are using everywhere async/await, you should be fine.
If you need to use a callback, you have two options:
1. use utils.promisify and stay with async/await (preferred option)
2. use AsyncResource.bind(yourCallback)

Without it, the thread chain will lose transaction details which are hard to track.

Performance of AsyncLocalStorage is fine with Node >=16.2.0. 
More details you can find here https://github.com/nodejs/node/issues/34493#issuecomment-845094849
This is the reason why I use it as a minimal nodejs version.

### How to use multiple transactions

Working with multiple models and different transactions is not an easy task. For this purpose you can use

```ts
import { User } from '../models';

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
import { User } from '../models';

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

const IsolatedUser = User.isolate();
```

For example why to use it: 
1. when your model is using dataloaders
2. when your model is storing data and using it later

# Mixins

Sometimes you want to use same logic across your models. For example automatically set updatedAt when you update row data.
Here is example how to define model which has support for mixins.

```ts 
import { applyMixins, updatedAt } from 'kysely-orm';
import db from './db';

class User extends updatedAt<DB, 'users', 'id'>('updatedAt')(db.model('users', 'id')) {
  findByEmail(email: string) {
    return this.findOne('email', email);
  }
}
```

## Helper applyMixins 

If you are using many mixins it can be complicated and messy. Therefore you can use applyMixin which will help you to write "nicer" code.

```ts 
import { applyMixins, updatedAt, slug } from 'kysely-orm';
import db from './db';

class User extends applyMixins(
  db.model('users', 'id'),
  (model) => updatedAt(model, 'updatedAt'),
  (model) => slug(model, {
    field: 'username',
    sources: ['name', 'firstName', 'lastName'],
    slugOptions: {
      truncate: 15,
    },
  }),
) {
  findByEmail(email: string) {
    return this.findOne('email', email);
  }
}
```

## Mixin updatedAt

It will set your db field to NOW() during any update

```ts 
import { applyMixins, updatedAt } from 'kysely-orm';
import db from './db';

export default class User extends applyMixins(
  db.model('users', 'id'),
  (model) => updatedAt(model, 'updatedAt'),
) {
  findByEmail(email: string) {
    return this.findOne('email', email);
  }
}
```

## Mixin slug

It will automatically compute url slug from your data and use it during db insert

```ts 
import { applyPlugins, slug } from 'kysely-orm';
import type DB from './@types/DB';

export default class User extends applyMixins(
  db.model('users', 'id'),
  (model) => slug(model, {
    field: 'username',
    sources: ['name', 'firstName', 'lastName'],
    slugOptions: {
      truncate: 15,
    },
  }),
) {
  findByEmail(email: string) {
    return this.findOne('email', email);
  }
}
```

# Standard Model methods and properties

```ts
class Model {
  static db = db;
  static table = table;
  static id = id;

  get $id() {
    return (<typeof Model>this.constructor).id;
  }

  get $table() {
    return (<typeof Model>this.constructor).table;
  }

  get $db() {
    return (<typeof Model>this.constructor).db;
  }

  static create<Instance extends typeof Model, Data>(this: Instance, data: Data) {
    return new this(data) as InstanceType<Instance>;
  }

  test<Type>(callback: TransactionCallback<DB, Type>) {
    return db.transaction(callback);
  }

  static isolate() {
    return class extends this {};
  }

  static transaction<Type>(callback: TransactionCallback<DB, Type>) {
    return this.db.transaction(callback);
  }

  static get dynamic() {
    return this.db.dynamic;
  }

  static ref(reference: string) {
    return this.db.dynamic.ref(reference);
  }

  static get fn() {
    return this.db.fn;
  }

  static selectFrom() {
    return this.db.selectFrom(this.table);
  }

  static updateTable() {
    return this.db.updateTable(this.table);
  }

  static insertInto() {
    return this.db.insertInto(this.table);
  }

  static deleteFrom() {
    return this.db.deleteFrom(this.table);
  }

  static async find<Instance extends typeof Model, ColumnName extends keyof DB[TableName] & string>(
    this: Instance,
    column: ColumnName,
    values: SelectType<DB[TableName][ColumnName]>[],
  ) {
    const items = await this
      .selectFrom()
      .where(this.ref(column as string), 'in', values)
      .selectAll()
      .execute();

    return items?.map(item => new this(item) as InstanceType<Instance>);
  }

  static async findOne<ColumnName extends keyof DB[TableName] & string>(
    column: ColumnName,
    value: SelectType<DB[TableName][ColumnName]>,
  ) {
    const item = await this
      .selectFrom()
      .where(this.ref(column as string), '=', value)
      .selectAll()
      .limit(1)
      .executeTakeFirst();

    return item && this.create(item);
  }

  static findById(id: SelectType<DB[TableName][IdColumnName]>) {
    return this.findOne(this.id, id);
  }

  static findByIds(ids: SelectType<DB[TableName][IdColumnName]>[]) {
    return this.find(this.id, ids);
  }

  static async getOne<ColumnName extends keyof DB[TableName] & string>(
    column: ColumnName,
    value: SelectType<DB[TableName][ColumnName]>,
    error: typeof NoResultError = NoResultError,
  ) {
    const item = await this
      .selectFrom()
      .where(this.ref(column as string), '=', value)
      .selectAll()
      .limit(1)
      .executeTakeFirstOrThrow(error);

    return this.create(item);
  }

  static getById(id: SelectType<DB[TableName][IdColumnName]>) {
    return this.getOne(this.id, id);
  }
  
  static async findOneAndUpdate<ColumnName extends keyof DB[TableName] & string>(
    column: ColumnName,
    value: SelectType<DB[TableName][ColumnName]>,
    data: Updateable<InsertObject<DB, TableName>>,
  ) {
    const processedData = await this.beforeUpdate(data);

    const item = await this
      .updateTable()
      .where(this.ref(column as string), '=', value)
      .set(processedData)
      .returningAll()
      .executeTakeFirst();

    return item && this.create(item);
  }

  static findByIdAndUpdate(id: SelectType<DB[TableName][IdColumnName]>, data: Updateable<InsertObject<DB, TableName>>) {
    return this.findOneAndUpdate(this.id, id, data);
  }
  
  static async getOneAndUpdate<ColumnName extends keyof DB[TableName] & string>(
    column: ColumnName,
    value: SelectType<DB[TableName][ColumnName]>,
    data: Updateable<InsertObject<DB, TableName>>,
    error: typeof NoResultError = NoResultError,
  ) {
    const processedData = await this.beforeUpdate(data);

    const item = await this
      .updateTable()
      .where(this.ref(column as string), '=', value)
      .set(processedData)
      .returningAll()
      .executeTakeFirstOrThrow(error);

    return this.create(item);
  }

  static getByIdAndUpdate(id: SelectType<DB[TableName][IdColumnName]>, data: Updateable<InsertObject<DB, TableName>>) {
    return this.getOneAndUpdate(this.id, id, data);
  }
  
  static lock<ColumnName extends keyof DB[TableName] & string>(
    column: ColumnName,
    value: SelectType<DB[TableName][ColumnName]>,
  ) {
    return this
      .selectFrom()
      .where(this.ref(column as string), '=', value)
      .selectAll()
      .forUpdate()
      .executeTakeFirst();
  }

  static lockById(id: SelectType<DB[TableName][IdColumnName]>) {
    return this.lock(this.id, id);
  }
  
  static async insert(
    values: Insertable<DB[TableName]>,
    error: typeof NoResultError = NoResultError,
  ) {
    const processedValues = await this.beforeInsert(values);

    const item = await this
      .insertInto()
      .values(processedValues)
      .returningAll()
      .executeTakeFirstOrThrow(error);

    return this.create(item);
  }
  
  static async deleteOne<ColumnName extends keyof DB[TableName] & string>(
    column: ColumnName,
    value: SelectType<DB[TableName][ColumnName]>,
    error: typeof NoResultError = NoResultError,
  ) {
    const { numDeletedRows } = await this
      .deleteFrom()
      .where(this.ref(column as string), '=', value)
      .executeTakeFirstOrThrow(error);

    return numDeletedRows;
  }

  static async deleteMany<ColumnName extends keyof DB[TableName] & string>(
    column: ColumnName,
    values: SelectType<DB[TableName][ColumnName]>[],
    error: typeof NoResultError = NoResultError,
  ) {
    const { numDeletedRows } = await this
      .deleteFrom()
      .where(this.ref(column as string), 'in', values)
      .executeTakeFirstOrThrow(error);

    return numDeletedRows;
  }

  static deleteById(id: SelectType<DB[TableName][IdColumnName]>) {
    return this.deleteOne(this.id, id);
  }
}
```
