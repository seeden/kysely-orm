import { type SelectType, type Updateable, type InsertObject, type Insertable, type Selectable, NoResultError } from 'kysely';
import type Database from './Database';
import { type TransactionCallback } from './Database';

export type ModelType<Table> = Selectable<Table>;
export type StaticThis<T> = { new (): T }; 

export { NoResultError };

export class ModelBase<DB> {
  readonly db: Database<DB>;

  constructor(db: Database<DB>) {
    this.db = db;
  }
}

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
