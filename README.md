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
import { isolate } from 'kysely-orm';
import { User } from '../models';

const { User: IsolatedUser } = isolate({ User });
```

For example why to use it: 
1. when your model is using dataloaders
2. when your model is storing data and using it later

# Mixins

Sometimes you want to use same logic across your models. For example automatically set updatedAt when you update row data.
Here is example how to define model which has support for mixins.

```ts 
import { updatedAt } from 'kysely-orm';
import db from './db';

const BaseModel = db.model('users', 'id');

class User extends updatedAt<DB, 'users', 'id', typeof BaseModel>(BaseModel, 'updatedAt') {
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

class User extends applyMixins(db, 'users', 'id')(
  (model) => <DB, 'users', 'id', typeof model>updatedAt(model, 'updatedAt'),
  (model) => <DB, 'users', 'id', typeof model>slug(model, {
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

export default class User extends applyMixins(db, 'users', 'id')(
  (model) => <DB, 'users', 'id', typeof model>updatedAt(model, 'updatedAt'),
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

export default class User extends applyMixins(db, 'users', 'id')(
  (model) => <DB, 'users', 'id', typeof model>slug(model, {
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

# Use model as correct selectable type

Until TypeScript fix https://github.com/microsoft/TypeScript/issues/40451 there is a simple option how to use model as correct type. Interface named same as type in file will merge all attributes automatically.

```ts
import { type Selectable, Database } from 'kysely-orm';

interface Users {
  id: Generated<number>;
  name: string;
}

interface DB {
  users: Users;
};

const db = new Database<DB>({
  connectionString: '...',
});

export default interface User extends Selectable<Users> {};
export default class User extends db.model('users', 'id') {

}
```

```ts
import User from './User';

const user = new User({
  id: 1,
  name: 'Adam',
});

console.log(user.name); // name has correct type string
```

Without interface, user.name will throw error about unknown property.

# Standard Model methods and properties

```ts
class Model {
  static readonly db: Database<DB> = db;
  static readonly table: TableName = table;
  static readonly id: IdColumnName = id;

  constructor(data: Data) {
    Object.assign(this, data);
  }

  static relation<
    FromColumnName extends keyof DB[TableName] & string,
    FromReferenceExpression extends ReferenceExpression<DB, TableName, FromColumnName>,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
  >(
    type: RelationType.BelongsToOneRelation | RelationType.HasOneRelation | RelationType.HasOneThroughRelation, 
    from: FromReferenceExpression, 
    to: ReferenceExpression<DB, ToTableName, ToColumnName>
  ): OneRelation<
    DB, 
    TableName, 
    FromColumnName, 
    ToTableName,
    ToColumnName
  >;
  static relation<
    FromColumnName extends keyof DB[TableName] & string,
    FromReferenceExpression extends ReferenceExpression<DB, TableName, FromColumnName>,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
  >(
    type: RelationType.BelongsToManyRelation | RelationType.HasManyRelation | RelationType.HasManyThroughRelation, 
    from: FromReferenceExpression, 
    to: ReferenceExpression<DB, ToTableName, ToColumnName>
  ): ManyRelation<
    DB, 
    TableName, 
    FromColumnName, 
    ToTableName,
    ToColumnName
  >;
  static relation<
    FromColumnName extends keyof DB[TableName] & string,
    FromReferenceExpression extends ReferenceExpression<DB, TableName, FromColumnName>,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
  >(type: RelationType, from: FromReferenceExpression, to: ReferenceExpression<DB, ToTableName, ToColumnName>): any {
    return {
      type,
      from,
      to,
    };
  }

  static async beforeInsert(data: Insertable<Table>) {
    return data;
  }

  static async beforeUpdate(data: Updateable<InsertObject<DB, TableName>>) {
    return data;
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

  static async find<ColumnName extends keyof Table & string>(
    column: ColumnName,
    values: SelectType<Table[ColumnName]>[],
  ) {
    return this
      .selectFrom()
      .where(this.ref(column as string), 'in', values)
      .selectAll()
      .execute();
  }

  static async findOne<ColumnName extends keyof Table & string>(
    column: ColumnName,
    value: SelectType<Table[ColumnName]>,
  ) {
    return this
      .selectFrom()
      .where(this.ref(column as string), '=', value)
      .selectAll()
      .limit(1)
      .executeTakeFirst();
  }

  static async findByFields(fields: Partial<{
    [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]> | SelectType<Table[ColumnName]>[];
  }>) {
    return this
      .selectFrom()
      .where((qb) => {
        let currentQuery = qb;
        for (const [column, value] of Object.entries(fields)) {
          if (Array.isArray(value)) {
            currentQuery = currentQuery.where(this.ref(column as string), 'in', value);
          } else {
            currentQuery = currentQuery.where(this.ref(column as string), '=', value);
          }
        }
        return currentQuery;
      })
      .selectAll()
      .execute();
  }

  static async findOneByFields(fields: Partial<{
    [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]>;
  }>) {
    return this
      .selectFrom()
      .where((qb) => {
        let currentQuery = qb;
        for (const [column, value] of Object.entries(fields)) {
          if (Array.isArray(value)) {
            currentQuery = currentQuery.where(this.ref(column as string), 'in', value);
          } else {
            currentQuery = currentQuery.where(this.ref(column as string), '=', value);
          }
        }
        return currentQuery;
      })
      .selectAll()
      .executeTakeFirst();
  }

  static async getOneByFields(fields: Partial<{
    [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]>;
  }>, error: typeof NoResultError = NotFoundError) {
    return this
      .selectFrom()
      .where((qb) => {
        let currentQuery = qb;
        for (const [column, value] of Object.entries(fields)) {
          if (Array.isArray(value)) {
            currentQuery = currentQuery.where(this.ref(column as string), 'in', value);
          } else {
            currentQuery = currentQuery.where(this.ref(column as string), '=', value);
          }
        }
        return currentQuery;
      })
      .selectAll()
      .executeTakeFirstOrThrow(error);
  }

  static findById(id: SelectType<IdColumn>) {
    return this.findOne(this.id, id);
  }

  static findByIds(ids: SelectType<IdColumn>[]) {
    return this.find(this.id, ids);
  }

  static async getOne<ColumnName extends keyof Table & string>(
    column: ColumnName,
    value: SelectType<Table[ColumnName]>,
    error: typeof NoResultError = NotFoundError,
  ) {
    const item = await this
      .selectFrom()
      .where(this.ref(column as string), '=', value)
      .selectAll()
      .limit(1)
      .executeTakeFirstOrThrow(error);

    return item;
  }

  static getById(id: SelectType<IdColumn>) {
    return this.getOne(this.id, id);
  }
  
  static async findOneAndUpdate<ColumnName extends keyof Table & string>(
    column: ColumnName,
    value: SelectType<Table[ColumnName]>,
    data: Updateable<InsertObject<DB, TableName>>,
  ) {
    const processedData = await this.beforeUpdate(data);

    return this
      .updateTable()
      .where(this.ref(column as string), '=', value)
      .set(processedData)
      .returningAll()
      .executeTakeFirst();
  }

  static async findByFieldsAndUpdate(
    fields: Partial<{
      [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]> | SelectType<Table[ColumnName]>[];
    }>, 
    data: Updateable<InsertObject<DB, TableName>>
  ) {
    return this
      .updateTable()
      .where((qb) => {
        let currentQuery = qb;
        for (const [column, value] of Object.entries(fields)) {
          if (Array.isArray(value)) {
            currentQuery = currentQuery.where(this.ref(column as string), 'in', value);
          } else {
            currentQuery = currentQuery.where(this.ref(column as string), '=', value);
          }
        }
        return currentQuery;
      })
      .set(data)
      .returningAll()
      .execute();
  }

  static async findOneByFieldsAndUpdate(
    fields: Partial<{
      [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]> | SelectType<Table[ColumnName]>[];
    }>, 
    data: Updateable<InsertObject<DB, TableName>>
  ) {
    // TODO use with and select with limit 1
    return this
      .updateTable()
      .where((qb) => {
        let currentQuery = qb;
        for (const [column, value] of Object.entries(fields)) {
          if (Array.isArray(value)) {
            currentQuery = currentQuery.where(this.ref(column as string), 'in', value);
          } else {
            currentQuery = currentQuery.where(this.ref(column as string), '=', value);
          }
        }
        return currentQuery;
      })
      .set(data)
      .returningAll()
      .executeTakeFirst();
  }

  static async getOneByFieldsAndUpdate(
    fields: Partial<{
      [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]> | SelectType<Table[ColumnName]>[];
    }>, 
    data: Updateable<InsertObject<DB, TableName>>,
    error: typeof NoResultError = NotFoundError,
  ) {
    // TODO use with and select with limit 1
    return this
      .updateTable()
      .where((qb) => {
        let currentQuery = qb;
        for (const [column, value] of Object.entries(fields)) {
          if (Array.isArray(value)) {
            currentQuery = currentQuery.where(this.ref(column as string), 'in', value);
          } else {
            currentQuery = currentQuery.where(this.ref(column as string), '=', value);
          }
        }
        return currentQuery;
      })
      .set(data)
      .returningAll()
      .executeTakeFirstOrThrow(error);
  }

  static findByIdAndUpdate(id: SelectType<IdColumn>, data: Updateable<InsertObject<DB, TableName>>) {
    return this.findOneAndUpdate(this.id, id, data);
  }
  
  static async getOneAndUpdate<ColumnName extends keyof Table & string>(
    column: ColumnName,
    value: SelectType<Table[ColumnName]>,
    data: Updateable<InsertObject<DB, TableName>>,
    error: typeof NoResultError = NotFoundError,
  ) {
    const processedData = await this.beforeUpdate(data);

    return this
      .updateTable()
      .where(this.ref(column as string), '=', value)
      .set(processedData)
      .returningAll()
      .executeTakeFirstOrThrow(error);
  }

  static getByIdAndUpdate(id: SelectType<IdColumn>, data: Updateable<InsertObject<DB, TableName>>) {
    return this.getOneAndUpdate(this.id, id, data);
  }
  
  static lock<ColumnName extends keyof Table & string>(
    column: ColumnName,
    value: SelectType<Table[ColumnName]>,
  ) {
    return this
      .selectFrom()
      .where(this.ref(column as string), '=', value)
      .selectAll()
      .forUpdate()
      .executeTakeFirst();
  }

  static lockById(id: SelectType<IdColumn>) {
    return this.lock(this.id, id);
  }
  
  static async insert(
    values: Insertable<Table>,
    error: typeof NoResultError = NotFoundError,
  ) {
    const processedValues = await this.beforeInsert(values);

    return this
      .insertInto()
      .values(processedValues)
      .returningAll()
      .executeTakeFirstOrThrow(error);
  }
  
  static async deleteOne<ColumnName extends keyof Table & string>(
    column: ColumnName,
    value: SelectType<Table[ColumnName]>,
    error: typeof NoResultError = NotFoundError,
  ) {
    const { numDeletedRows } = await this
      .deleteFrom()
      .where(this.ref(column as string), '=', value)
      .executeTakeFirstOrThrow(error);

    return numDeletedRows;
  }

  static async deleteMany<ColumnName extends keyof Table & string>(
    column: ColumnName,
    values: SelectType<Table[ColumnName]>[],
    error: typeof NoResultError = NotFoundError,
  ) {
    const { numDeletedRows } = await this
      .deleteFrom()
      .where(this.ref(column as string), 'in', values)
      .executeTakeFirstOrThrow(error);

    return numDeletedRows;
  }

  static deleteById(id: SelectType<IdColumn>) {
    return this.deleteOne(this.id, id);
  }

  static relatedQuery<
    FromTableName extends TableName,
    FromColumnName extends keyof DB[TableName] & string,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
  >(models: Data[], relation: AnyRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>) {
    const { from, to } = relation;
    const [fromTable, fromColumn] = from.split('.') as [FromTableName, FromColumnName];
    const [toTable] = to.split('.') as [ToTableName, ToColumnName];

    // const oneResult = type === RelationType.HasOneRelation || type === RelationType.BelongsToOneRelation;

    // @ts-ignore
    const ids = models.map((model) => model[fromColumn]);

    return this
      .db
      .selectFrom(fromTable)
      // @ts-ignore
      .innerJoin(toTable, to, from)
      // @ts-ignore
      .where(from, 'in', ids)
      .selectAll(toTable);
  }

  static async findRelated<
    FromTableName extends TableName,
    FromColumnName extends keyof DB[TableName] & string,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
  >(models: Data[], relation: AnyRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>) {
    const { from, to } = relation;
    const [fromTable, fromColumn] = from.split('.') as [FromTableName, FromColumnName];
    const [toTable] = to.split('.') as [ToTableName, ToColumnName];

    // const oneResult = type === RelationType.HasOneRelation || type === RelationType.BelongsToOneRelation;

    // @ts-ignore
    const ids = models.map((model) => model[fromColumn]);

    return this
      .db
      .selectFrom(fromTable)
      // @ts-ignore
      .innerJoin(toTable, to, from)
      // @ts-ignore
      .where(from, 'in', ids)
      .selectAll(toTable)
      .execute();
  }

  static async findRelatedAndCombine<
    FromTableName extends TableName,
    FromColumnName extends keyof DB[TableName] & string,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
    Field extends string,
  >(models: Data[], relation: OneRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>, field: Field): Promise<Data & {
    [key in Field]: Selectable<DB[ToTableName]>;
  }[]>;
  static async findRelatedAndCombine<
    FromTableName extends TableName,
    FromColumnName extends keyof DB[TableName] & string,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
    Field extends string,
  >(models: Data[], relation: ManyRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>, field: Field): Promise<Data & {
    [key in Field]: Selectable<DB[ToTableName]>[];
  }>;

  static async findRelatedAndCombine<
    FromTableName extends TableName,
    FromColumnName extends keyof DB[TableName] & string,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
    Field extends string,
  >(models: Data[], relation: AnyRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>, field: Field): Promise<any> {
    const rows = await this.findRelated(models, relation);

    const { type, from, to } = relation;
    const [_fromTable, fromColumn] = from.split('.') as [FromTableName, FromColumnName];
    const [_toTable, toColumn] = to.split('.') as [ToTableName, ToColumnName];

    const oneResult = type === RelationType.HasOneRelation || type === RelationType.BelongsToOneRelation;

    // combine models and rows
    return models.map((model) => {
      // @ts-ignore
      const id = model[fromColumn];
      
      const row = oneResult 
        // @ts-ignore
        ? rows.find((row) => row[toColumn] === id)
        // @ts-ignore
        : rows.filter((row) => row[toColumn] === id);
      return { ...model, [field]: row };
    });
  }
}
```

### Best practices and coments and answer
 - Do not import models into your mixins. It will breaks isolation if you use it and throw errors
 - Models are not available from Database object because you can not ask for it from database object. It will breaks isolation, types and whole encapsulation.
 - Why not to use functions instead of classes? We need to bind db, table and id for all functions. If we use functions we will reinvent wheel.
 - When typescript fixed max limit issue we can use instance for each data row

