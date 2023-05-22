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
import { PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Database } from 'kysely-orm';
import type DB from './@types/Database';

export default new Database<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString,
    }),
  }),
});
```

## SQLite Example

```ts: ./config/db.ts
import { SqliteDialect } from 'kysely';
import SQLLiteDatabase from 'better-sqlite3';
import { Database } from 'kysely-orm';
import type DB from './@types/Database';

export default new Database<DB>({
  dialect: new SqliteDialect({
    database: new SQLLiteDatabase('test.db'),
  }),
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

# Best practices and coments and answer
 - Do not import models into your mixins. It will breaks isolation if you use it and throw errors
 - Models are not available from Database object because you can not ask for it from database object. It will breaks isolation, types and whole encapsulation.
 - Why not to use functions instead of classes? We need to bind db, table and id for all functions. If we use functions we will reinvent wheel.
 - When typescript fixed max limit issue we can use instance for each data row


# Standard Model methods and properties

```ts
class Model {
  static readonly db: Database<DB> = db;
  static readonly table: TableName = table;
  static readonly id: IdColumnName = id;
  static readonly noResultError: typeof NoResultError = noResultError;
  static isolated: boolean = false;

  // constructor(data: Data);
  constructor(...args: any[]) {
    Object.assign(this, args[0]);
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
    if (this.db.isolated && !this.isolated) {
      throw new Error('Cannot use selectFrom() in not isolated model. Call isolate({ Model }) first.');
    }
    return this.db.selectFrom(this.table);
  }

  static updateTable() {
    if (this.db.isolated && !this.isolated) {
      throw new Error('Cannot use updateTable() in not isolated model. Call isolate({ Model }) first.');
    }
    return this.db.updateTable(this.table);
  }

  static insertInto() {
    if (this.db.isolated && !this.isolated) {
      throw new Error('Cannot use insertInto() in not isolated model. Call isolate({ Model }) first.');
    }
    return this.db.insertInto(this.table);
  }

  static deleteFrom() {
    if (this.db.isolated && !this.isolated) {
      throw new Error('Cannot use deleteFrom() in not isolated model. Call isolate({ Model }) first.');
    }
    return this.db.deleteFrom(this.table);
  }

  static with<Name extends string, Expression extends CommonTableExpression<DB, Name>>(name: Name, expression: Expression) {
    return this.db.with(name, expression);
  }

  static async afterSingleInsert(singleResult: Selectable<Table>) {
    return singleResult;
  }

  static async afterSingleUpdate(singleResult: Selectable<Table>) {
    return singleResult;
  }

  static async afterSingleUpsert(singleResult: Selectable<Table>) {
    return singleResult;
  }

  static processDataBeforeUpdate(data: UpdateExpression<DB, TableName, TableName>): UpdateExpression<DB, TableName, TableName>;
  static processDataBeforeUpdate(data: UpdateExpression<OnConflictDatabase<DB, TableName>, OnConflictTables<TableName>, OnConflictTables<TableName>>): UpdateExpression<OnConflictDatabase<DB, TableName>, OnConflictTables<TableName>, OnConflictTables<TableName>>;
  static processDataBeforeUpdate(data: UpdateExpression<DB, TableName, TableName> | UpdateExpression<OnConflictDatabase<DB, TableName>, OnConflictTables<TableName>, OnConflictTables<TableName>>) {
    return data;
  }

  static processDataBeforeInsert(data: InsertObjectOrList<DB, TableName>) {
    return data;
  }

  static async find<ColumnName extends keyof Table & string>(
    column: ColumnName,
    values: Readonly<SelectType<Table[ColumnName]>[]> | Readonly<SelectType<Table[ColumnName]>>,
    func?: (qb: SelectQueryBuilder<DB, TableName, {}>) => SelectQueryBuilder<DB, TableName, {}>,
  ) {
    const isArray = Array.isArray(values);

    return this
      .selectFrom()
      .selectAll()
      .where(this.ref(`${this.table}.${column}`), isArray ? 'in' : '=', values)
      .$if(!!func, (qb) => func?.(qb as unknown as SelectQueryBuilder<DB, TableName, {}>) as unknown as typeof qb)
      .execute();
  }

  static async findOne<ColumnName extends keyof Table & string>(
    column: ColumnName,
    value: Readonly<SelectType<Table[ColumnName]>>,
    func?: (qb: SelectQueryBuilder<DB, TableName, {}>) => SelectQueryBuilder<DB, TableName, {}>,
  ) {
    return this
      .selectFrom()
      .selectAll()
      .where(this.ref(`${this.table}.${column}`), '=', value)
      .$if(!!func, (qb) => func?.(qb as unknown as SelectQueryBuilder<DB, TableName, {}>) as unknown as typeof qb)
      .limit(1)
      .executeTakeFirst();
  }

  static async findByFields(
    fields: Readonly<Partial<{
      [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]> | SelectType<Table[ColumnName]>[];
    }>>,
    func?: (qb: SelectQueryBuilder<DB, TableName, {}>) => SelectQueryBuilder<DB, TableName, {}>,
  ) {
    return this
      .selectFrom()
      .selectAll()
      .where((qb) => {
        let currentQuery = qb;
        for (const [column, value] of Object.entries(fields)) {
          const isArray = Array.isArray(value);
          currentQuery = currentQuery.where(this.ref(`${this.table}.${column}`), isArray ? 'in' : '=', value);
        }
        return currentQuery;
      })
      .$if(!!func, (qb) => func?.(qb as unknown as SelectQueryBuilder<DB, TableName, {}>) as unknown as typeof qb)
      .execute();
  }

  static async findOneByFields(
    fields: Readonly<Partial<{
      [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]>;
    }>>,
    func?: (qb: SelectQueryBuilder<DB, TableName, {}>) => SelectQueryBuilder<DB, TableName, {}>,
  ) {
    return this
      .selectFrom()
      .selectAll()
      .where((qb) => {
        let currentQuery = qb;
        for (const [column, value] of Object.entries(fields)) {
          const isArray = Array.isArray(value);
          currentQuery = currentQuery.where(this.ref(`${this.table}.${column}`), isArray ? 'in' : '=', value);
        }
        return currentQuery;
      })
      .$if(!!func, (qb) => func?.(qb as unknown as SelectQueryBuilder<DB, TableName, {}>) as unknown as typeof qb)
      .executeTakeFirst();
  }

  static async getOneByFields(
    fields: Readonly<Partial<{
      [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]>;
    }>>,
    func?: (qb: SelectQueryBuilder<DB, TableName, {}>) => SelectQueryBuilder<DB, TableName, {}>,
    error: typeof NoResultError = this.noResultError,
  ) {
    return this
      .selectFrom()
      .where((qb) => {
        let currentQuery = qb;
        for (const [column, value] of Object.entries(fields)) {
          const isArray = Array.isArray(value);
          currentQuery = currentQuery.where(this.ref(`${this.table}.${column}`), isArray ? 'in' : '=', value);
        }
        return currentQuery;
      })
      .selectAll()
      .$if(!!func, (qb) => func?.(qb as unknown as SelectQueryBuilder<DB, TableName, {}>) as unknown as typeof qb)
      .executeTakeFirstOrThrow(error);
  }

  static findById(
    id: Id,
    func?: (qb: SelectQueryBuilder<DB, TableName, {}>) => SelectQueryBuilder<DB, TableName, {}>,
  ) {
    return this.findOne(this.id, id, func);
  }

  static findByIds(
    ids: Readonly<SelectType<IdColumn>[]>,
    func?: (qb: SelectQueryBuilder<DB, TableName, {}>) => SelectQueryBuilder<DB, TableName, {}>,
  ) {
    return this.find(this.id, ids, func);
  }

  static async getOne<ColumnName extends keyof Table & string>(
    column: ColumnName,
    value: Readonly<SelectType<Table[ColumnName]>>,
    func?: (qb: SelectQueryBuilder<DB, TableName, {}>) => SelectQueryBuilder<DB, TableName, {}>,
    error: typeof NoResultError = this.noResultError,
  ) {
    const item = await this
      .selectFrom()
      .selectAll()
      .where(this.ref(`${this.table}.${column}`), '=', value)
      .$if(!!func, (qb) => func?.(qb as unknown as SelectQueryBuilder<DB, TableName, {}>) as unknown as typeof qb)
      .limit(1)
      .executeTakeFirstOrThrow(error);

    return item;
  }

  static getById(
    id: Id,
    func?: (qb: SelectQueryBuilder<DB, TableName, {}>) => SelectQueryBuilder<DB, TableName, {}>,
    error: typeof NoResultError = this.noResultError,
  ) {
    return this.getOne(this.id, id, func, error);
  }
  
  static async findOneAndUpdate<ColumnName extends keyof Table & string>(
    column: ColumnName,
    value: Readonly<SelectType<Table[ColumnName]>>,
    data: UpdateExpression<DB, TableName, TableName>,
    func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
  ) {
    const updatedData = this.processDataBeforeUpdate(data);
    const record = await this
      .updateTable()
      // @ts-ignore
      .set(updatedData)
      .where(this.ref(`${this.table}.${column}`), '=', value)
      .$if(!!func, (qb) => func?.(qb as unknown as UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) as unknown as typeof qb)
      .returningAll()
      .executeTakeFirst();

    return record ? this.afterSingleUpdate(record as Selectable<Table>) : record;
  }

  static async findByFieldsAndUpdate(
    fields: Readonly<Partial<{
      [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]> | SelectType<Table[ColumnName]>[];
    }>>, 
    data: UpdateExpression<DB, TableName, TableName>,
    func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
  ) {
    const updatedData = this.processDataBeforeUpdate(data);

    return await this
      .updateTable()
      // @ts-ignore
      .set(updatedData)
      .where((qb) => {
        let currentQuery = qb;
        for (const [column, value] of Object.entries(fields)) {
          if (Array.isArray(value)) {
            currentQuery = currentQuery.where(this.ref(`${this.table}.${column}`), 'in', value);
          } else {
            currentQuery = currentQuery.where(this.ref(`${this.table}.${column}`), '=', value);
          }
        }
        return currentQuery;
      })
      .$if(!!func, (qb) => func?.(qb as unknown as UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) as unknown as typeof qb)
      .returningAll()
      .execute();
  }

  static async findOneByFieldsAndUpdate(
    fields: Readonly<Partial<{
      [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]> | SelectType<Table[ColumnName]>[];
    }>>, 
    data: UpdateExpression<DB, TableName, TableName>,
    func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
  ) {
    // TODO use with and select with limit 1
    const updatedData = this.processDataBeforeUpdate(data);
    const record = await this
      .updateTable()
      // @ts-ignore
      .set(updatedData)
      .where((qb) => {
        let currentQuery = qb;
        for (const [column, value] of Object.entries(fields)) {
          if (Array.isArray(value)) {
            currentQuery = currentQuery.where(this.ref(`${this.table}.${column}`), 'in', value);
          } else {
            currentQuery = currentQuery.where(this.ref(`${this.table}.${column}`), '=', value);
          }
        }
        return currentQuery;
      })
      .$if(!!func, (qb) => func?.(qb as unknown as UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) as unknown as typeof qb)
      .returningAll()
      .executeTakeFirst();

    return record ? this.afterSingleUpdate(record as Selectable<Table>) : record;
  }

  static async getOneByFieldsAndUpdate(
    fields: Readonly<Partial<{
      [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]> | SelectType<Table[ColumnName]>[];
    }>>, 
    data: UpdateExpression<DB, TableName, TableName>,
    func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    error: typeof NoResultError = this.noResultError,
  ) {
    // TODO use with and select with limit 1
    const updatedData = this.processDataBeforeUpdate(data);
    const record = await this
      .updateTable()
      // @ts-ignore
      .set(updatedData)
      .where((qb) => {
        let currentQuery = qb;
        for (const [column, value] of Object.entries(fields)) {
          if (Array.isArray(value)) {
            currentQuery = currentQuery.where(this.ref(`${this.table}.${column}`), 'in', value);
          } else {
            currentQuery = currentQuery.where(this.ref(`${this.table}.${column}`), '=', value);
          }
        }
        return currentQuery;
      })
      .$if(!!func, (qb) => func?.(qb as unknown as UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) as unknown as typeof qb)
      .returningAll()
      .executeTakeFirstOrThrow(error);

    return this.afterSingleUpdate(record  as Selectable<Table>);
  }

  static findByIdAndUpdate(
    id: SelectType<IdColumn>, 
    data: UpdateExpression<DB, TableName, TableName>,
    func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
  ) {
    return this.findOneAndUpdate(this.id, id, data, func);
  }
  
  static async getOneAndUpdate<ColumnName extends keyof Table & string>(
    column: ColumnName,
    value: Readonly<SelectType<Table[ColumnName]>>,
    data: UpdateExpression<DB, TableName, TableName>,
    func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    error: typeof NoResultError = this.noResultError,
  ) {
    const updatedData = this.processDataBeforeUpdate(data);
    const record = await this
      .updateTable()
      // @ts-ignore
      .set(updatedData)
      .where(this.ref(`${this.table}.${column}`), '=', value)
      .$if(!!func, (qb) => func?.(qb as unknown as UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) as unknown as typeof qb)
      .returningAll()
      .executeTakeFirstOrThrow(error);

    return this.afterSingleUpdate(record as Selectable<Table>);
  }

  static getByIdAndUpdate(
    id: SelectType<IdColumn>, 
    data: UpdateExpression<DB, TableName, TableName>,
    func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    error: typeof NoResultError = this.noResultError,
  ) {
    return this.getOneAndUpdate(this.id, id, data, func, error);
  }
  
  static lock<ColumnName extends keyof Table & string>(
    column: ColumnName,
    value: Readonly<SelectType<Table[ColumnName]>>,
  ) {
    return this
      .selectFrom()
      .where(this.ref(`${this.table}.${column}`), '=', value)
      .selectAll()
      .forUpdate()
      .executeTakeFirst();
  }

  static lockById(id: SelectType<IdColumn>) {
    return this.lock(this.id, id);
  }
  
  static async insertOne(
    values: InsertObject<DB, TableName>,
    error: typeof NoResultError = this.noResultError,
  ) {
    const record = await this
      .insertInto()
      .values(this.processDataBeforeInsert(values))
      .returningAll()
      .executeTakeFirstOrThrow(error);

    return this.afterSingleInsert(record);
  }

  static async insert(
    values: InsertObjectOrList<DB, TableName>,
  ) {
    return this
      .insertInto()
      .values(this.processDataBeforeInsert(values))
      .returningAll()
      .execute();
  }

  static async upsertOne(
    values: InsertObject<DB, TableName>,
    upsertValues: UpdateExpression<OnConflictDatabase<DB, TableName>, OnConflictTables<TableName>, OnConflictTables<TableName>>,
    conflictColumns: Readonly<(keyof Table & string)[]> | Readonly<keyof Table & string>,
    func?: (qb: OnConflictUpdateBuilder<DB, TableName>) => OnConflictUpdateBuilder<DB, TableName>,
    error: typeof NoResultError = this.noResultError,
  ) {
    const record = await this
      .insertInto()
      .values(this.processDataBeforeInsert(values))
      .onConflict((ocb) => {
        const updatedOCB = ocb
          .columns(Array.isArray(conflictColumns) ? conflictColumns : [conflictColumns])
          .doUpdateSet(this.processDataBeforeUpdate(upsertValues)) as OnConflictUpdateBuilder<DB, TableName>;

        return func ? func(updatedOCB) : updatedOCB;
      })
      .returningAll()
      .executeTakeFirstOrThrow(error);

    return this.afterSingleUpsert(record);
  }

  static async upsert(
    values: InsertObjectOrList<DB, TableName>,
    upsertValues: UpdateExpression<OnConflictDatabase<DB, TableName>, OnConflictTables<TableName>, OnConflictTables<TableName>>,
    conflictColumns: Readonly<(keyof Table & string)[]> | Readonly<keyof Table & string>,
    func?: (qb: OnConflictUpdateBuilder<DB, TableName>) => OnConflictUpdateBuilder<DB, TableName>,
  ) {
    return await this
      .insertInto()
      .values(this.processDataBeforeInsert(values))
      .onConflict((ocb) => {
        const updatedOCB = ocb
          .columns(Array.isArray(conflictColumns) ? conflictColumns : [conflictColumns])
          .doUpdateSet(this.processDataBeforeUpdate(upsertValues)) as OnConflictUpdateBuilder<DB, TableName>;

        return func ? func(updatedOCB) : updatedOCB;
      })
      .returningAll()
      .execute();
  }

  static async insertOneIfNotExists<Values extends InsertObject<DB, TableName>>(
    values: Values,
    sameColumn: keyof DB[TableName] & string,
    conflictColumns: Readonly<(keyof Table & string)[]> | Readonly<keyof Table & string>,
    func?: (qb: OnConflictUpdateBuilder<DB, TableName>) => OnConflictUpdateBuilder<DB, TableName>,
    error: typeof NoResultError = this.noResultError,
  ) {
    const record = await this
      .insertInto()
      .values(values)
      .onConflict((ocb) => {
        const updatedOCB = ocb
          .columns(Array.isArray(conflictColumns) ? conflictColumns : [conflictColumns])
          .doUpdateSet({
            // use current value instead of excluded because excluded value is not required
            [sameColumn]: (eb: any) => eb.ref(`${this.table}.${sameColumn}`)
          } as UpdateExpression<OnConflictDatabase<DB, TableName>, OnConflictTables<TableName>, OnConflictTables<TableName>>) as OnConflictUpdateBuilder<DB, TableName>;
        
        return func ? func(updatedOCB) : updatedOCB;
      })
      .returningAll()
      .executeTakeFirstOrThrow(error);

    return this.afterSingleInsert(record);
  }
  
  // todo add limit via with
  static async deleteOne<ColumnName extends keyof Table & string>(
    column: ColumnName,
    value: Readonly<SelectType<Table[ColumnName]>>,
    func?: (qb: DeleteQueryBuilder<DB, TableName, DeleteResult>) => DeleteQueryBuilder<DB, TableName, DeleteResult>,
    error: typeof NoResultError = this.noResultError,
  ) {
    const { numDeletedRows } = await this
      .deleteFrom()
      .where(this.ref(`${this.table}.${column}`), '=', value)
      .$if(!!func, (qb) => func?.(qb as unknown as DeleteQueryBuilder<DB, TableName, DeleteResult>) as unknown as typeof qb)
      .executeTakeFirstOrThrow(error);

    return numDeletedRows;
  }

  // todo add limit via with
  static async deleteOneByFields(
    fields: Readonly<Partial<{
      [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]> | SelectType<Table[ColumnName]>[];
    }>>, 
    func?: (qb: DeleteQueryBuilder<DB, TableName, DeleteResult>) => DeleteQueryBuilder<DB, TableName, DeleteResult>,
    error: typeof NoResultError = this.noResultError,
  ) {
    const { numDeletedRows } = await this
      .deleteFrom()
      .where((qb) => {
        let currentQuery = qb;
        for (const [column, value] of Object.entries(fields)) {
          if (Array.isArray(value)) {
            currentQuery = currentQuery.where(this.ref(`${this.table}.${column}`), 'in', value);
          } else {
            currentQuery = currentQuery.where(this.ref(`${this.table}.${column}`), '=', value);
          }
        }
        return currentQuery;
      })
      .$if(!!func, (qb) => func?.(qb as unknown as DeleteQueryBuilder<DB, TableName, DeleteResult>) as unknown as typeof qb)
      .executeTakeFirstOrThrow(error);
    
    return numDeletedRows;
  }

  static async deleteMany<ColumnName extends keyof Table & string>(
    column: ColumnName,
    values: Readonly<SelectType<Table[ColumnName]>[]>,
    func?: (qb: DeleteQueryBuilder<DB, TableName, DeleteResult>) => DeleteQueryBuilder<DB, TableName, DeleteResult>,
    error: typeof NoResultError = this.noResultError,
  ) {
    const { numDeletedRows } = await this
      .deleteFrom()
      .where(this.ref(`${this.table}.${column}`), 'in', values)
      .$if(!!func, (qb) => func?.(qb as unknown as DeleteQueryBuilder<DB, TableName, DeleteResult>) as unknown as typeof qb)
      .executeTakeFirstOrThrow(error);

    return numDeletedRows;
  }

  static deleteById(id: SelectType<IdColumn>) {
    return this.deleteOne(this.id, id);
  }

  static findByIdAndIncrementQuery(
    id: Id, 
    columns: Partial<Record<keyof Table, number>>,
    func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
  ) {
    const setData: Updateable<Table> = {};

    Object.keys(columns).forEach((column) => {
      const value = columns[column as keyof Table] as number;
      const correctColumn = column as keyof Updateable<Table>;

      setData[correctColumn] = sql`${sql.ref(`${this.table}.${column}`)} + ${value}` as any;
    });

    return this
      .updateTable()
      // @ts-ignore
      .set(setData)
      .where(this.ref(this.id), '=', id)
      .$if(!!func, (qb) => func?.(qb as unknown as UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) as unknown as typeof qb)
      .returningAll();
  }

  static async findByIdAndIncrement(
    id: Id, 
    columns: Partial<Record<keyof Table, number>>,
    func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
  ) {
    const record = await this.findByIdAndIncrementQuery(id, columns, func).executeTakeFirst();

    return record ? this.afterSingleUpdate(record as Selectable<Table>) : record;
  }

  static async getByIdAndIncrement(
    id: Id, 
    columns: Partial<Record<keyof Table, number>>,
    func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    error: typeof NoResultError = this.noResultError,
  ) {
    const record = await this
      .findByIdAndIncrementQuery(id, columns, func)
      .executeTakeFirstOrThrow(error);

    return this.afterSingleUpdate(record as Selectable<Table>);
  }

  static relatedQuery<
    FromTableName extends TableName,
    FromColumnName extends keyof DB[TableName] & string,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
  >(relation: AnyRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>, ids: Id | Id[] = []) {
    const { from, to } = relation;
    const [fromTable] = from.split('.') as [FromTableName, FromColumnName];
    const [toTable] = to.split('.') as [ToTableName, ToColumnName];

    return this.db
      .selectFrom(fromTable)
      .innerJoin(toTable, (jb) => jb.onRef(this.ref(from), '=', this.ref(to)))
      .where(this.ref(`${fromTable}.${this.id}`), Array.isArray(ids) ? 'in' : '=', ids)
      .selectAll(toTable);
  }

  static async findRelatedById<
    FromTableName extends TableName,
    FromColumnName extends keyof DB[TableName] & string,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
  >(
    relation: OneRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>, 
    id: Id,
    error?: typeof NoResultError,
  ): Promise<Selectable<DB[ToTableName]> | undefined>;

  static async findRelatedById<
    FromTableName extends TableName,
    FromColumnName extends keyof DB[TableName] & string,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
  >(
    relation: ManyRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>, 
    id: Id,
    error?: typeof NoResultError,
  ): Promise<Selectable<DB[ToTableName]>[]>;

  static async findRelatedById<
    FromTableName extends TableName,
    FromColumnName extends keyof DB[TableName] & string,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
  >(
    relation: AnyRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>, 
    id: Id,
  ): Promise<Selectable<DB[ToTableName]> | undefined | Selectable<DB[ToTableName]>[]> {
    const { type } = relation;
    const oneResult = type === RelationType.HasOneRelation || type === RelationType.BelongsToOneRelation;
    if (oneResult) {
      return await this.relatedQuery(relation, id).executeTakeFirst() as Selectable<DB[ToTableName]> | undefined;
    }

    return await this.relatedQuery(relation, id).execute() as Selectable<DB[ToTableName]>[];
  }

  static async getRelatedById<
    FromTableName extends TableName,
    FromColumnName extends keyof DB[TableName] & string,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
  >(
    relation: OneRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>, 
    id: Id,
    error?: typeof NoResultError,
  ): Promise<Selectable<DB[ToTableName]>>;

  static async getRelatedById<
    FromTableName extends TableName,
    FromColumnName extends keyof DB[TableName] & string,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
  >(
    relation: ManyRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>, 
    id: Id,
    error?: typeof NoResultError,
  ): Promise<Selectable<DB[ToTableName]>[]>;

  static async getRelatedById<
    FromTableName extends TableName,
    FromColumnName extends keyof DB[TableName] & string,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
  >(
    relation: AnyRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>, 
    id: Id,
    error: typeof NoResultError = this.noResultError,
  ): Promise<Selectable<DB[ToTableName]> | Selectable<DB[ToTableName]>[]> {
    const { type } = relation;
    const oneResult = type === RelationType.HasOneRelation || type === RelationType.BelongsToOneRelation;
    if (oneResult) {
      return await this.relatedQuery(relation, id).executeTakeFirstOrThrow(error) as Selectable<DB[ToTableName]>;
    }

    return await this.relatedQuery(relation, id).execute() as Selectable<DB[ToTableName]>[];
  }

  static async findRelated<
    FromTableName extends TableName,
    FromColumnName extends keyof DB[TableName] & string,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
  >(relation: AnyRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>, models: Data[]) {
    const { from, to } = relation;
    const [fromTable, fromColumn] = from.split('.') as [FromTableName, FromColumnName];
    const [toTable] = to.split('.') as [ToTableName, ToColumnName];

    // @ts-ignore
    const ids = models.map((model) => model[fromColumn]);

    return this
      .db
      .selectFrom(fromTable)
      .innerJoin(toTable, (jb) => jb.onRef(this.ref(from), '=', this.ref(to)))
      .where(this.ref(from), 'in', ids)
      .selectAll(toTable)
      .execute();
  }

  static async findRelatedAndCombine<
    FromTableName extends TableName,
    FromColumnName extends keyof DB[TableName] & string,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
    Field extends string,
  >(relation: OneRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>, models: Data[], field: Field): Promise<(Data & {
    [key in Field]: Selectable<DB[ToTableName]> | undefined;
  })[]>;
  static async findRelatedAndCombine<
    FromTableName extends TableName,
    FromColumnName extends keyof DB[TableName] & string,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
    Field extends string,
  >(relation: ManyRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>, models: Data[], field: Field): Promise<(Data & {
    [key in Field]: Selectable<DB[ToTableName]>[];
  })[]>;

  static async findRelatedAndCombine<
    FromTableName extends TableName,
    FromColumnName extends keyof DB[TableName] & string,
    ToTableName extends keyof DB & string,
    ToColumnName extends keyof DB[ToTableName] & string,
    Field extends string,
  >(relation: AnyRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>, models: Data[], field: Field): Promise<any> {
    const rows = await this.findRelated(relation, models);

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

  static jsonbIncrement(column: keyof Table & string, data: Record<string, number>) {
    const entries = Object.entries(data);
    if (!entries.length) {
      throw new Error('Data is empty');
    }

    const [[key, value], ...rest] = entries;

    let update: RawBuilder<string> = sql`jsonb_set(
      COALESCE(${sql.ref(`${this.table}.${column}`)}, '{}'), 
      ${sql.lit(`{${key}}`)}, 
      (COALESCE(${sql.ref(`${this.table}.${column}`)}->>${sql.lit(key)}, '0')::int + ${value})::text::jsonb
    )`;

    rest.forEach(([key, value]) => {
      update = sql`jsonb_set(
        ${update}, 
        ${sql.lit(`{${key}}`)}, 
        (COALESCE(${sql.ref(`${this.table}.${column}`)}->>${sql.lit(key)}, '0')::int + ${value})::text::jsonb
      )`;
    });
  
    return update;
  }
}
```
