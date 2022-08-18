import { type SelectType, type Updateable, type InsertObject, type Insertable, type Selectable, NoResultError } from 'kysely';
import type Database from '../Database';
import { type TransactionCallback } from '../Database';
import type Constructor from '../@types/Constructor';

export abstract class Updatable {
  static beforeUpdate: <Data>(data: Data) => Promise<Data>;
}

export default function model<TBase extends Constructor, DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string>(Base: TBase, db: Database<DB>, table: TableName, id: IdColumnName) {
  type Table = DB[TableName];
  type IdColumn = Table[IdColumnName];
  
  return class Model extends Base implements Updatable {
    static readonly db: Database<DB> = db;
    static readonly table: TableName = table;
    static readonly id: IdColumnName = id;

    /*
    get $id() {
      return (<typeof Model>this.constructor).id;
    }

    get $table() {
      return (<typeof Model>this.constructor).table;
    }

    get $db() {
      return (<typeof Model>this.constructor).db;
    }
    */

    static async beforeInsert(data: Insertable<Table>) {
      return data;
    }

    static async beforeUpdate(data: Updateable<InsertObject<DB, TableName>>) {
      return data;
    }

    static isolate() {
      return class extends this {};
    }

    static createInstance<Instance extends typeof Model>(this: Instance, data: any) {
      return new this(data) as InstanceType<Instance>;
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

    static async find<Instance extends typeof Model, ColumnName extends keyof Table & string>(
      this: Instance,
      column: ColumnName,
      values: SelectType<Table[ColumnName]>[],
    ) {
      const items = await this
        .selectFrom()
        .where(this.ref(column as string), 'in', values)
        .selectAll()
        .execute();

      return items?.map(item => this.createInstance(item));
    }

    static async findOne<ColumnName extends keyof Table & string>(
      column: ColumnName,
      value: SelectType<Table[ColumnName]>,
    ) {
      const item = await this
        .selectFrom()
        .where(this.ref(column as string), '=', value)
        .selectAll()
        .limit(1)
        .executeTakeFirst();

      return item && this.createInstance(item);
    }

    static async findByFields(fields: Partial<{
      [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]> | SelectType<Table[ColumnName]>[];
    }>) {
      const items = await this
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

      return items?.map(item => this.createInstance(item));
    }

    static async findOneByFields(fields: Partial<{
      [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]>;
    }>, error: typeof NoResultError = NoResultError) {
      const item = await this
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

      return item && this.createInstance(item);
    }

    static async getOneByFields(fields: Partial<{
      [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]>;
    }>, error: typeof NoResultError = NoResultError) {
      const item = await this
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

      return this.createInstance(item);
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
      error: typeof NoResultError = NoResultError,
    ) {
      const item = await this
        .selectFrom()
        .where(this.ref(column as string), '=', value)
        .selectAll()
        .limit(1)
        .executeTakeFirstOrThrow(error);

      return this.createInstance(item);
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

      const item = await this
        .updateTable()
        .where(this.ref(column as string), '=', value)
        .set(processedData)
        .returningAll()
        .executeTakeFirst();

      return item && this.createInstance(item);
    }

    static async findByFieldsAndUpdate(
      fields: Partial<{
        [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]> | SelectType<Table[ColumnName]>[];
      }>, 
      data: Updateable<InsertObject<DB, TableName>>
    ) {
      const items = await this
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

      return items?.map(item => this.createInstance(item));
    }

    static async findOneByFieldsAndUpdate(
      fields: Partial<{
        [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]> | SelectType<Table[ColumnName]>[];
      }>, 
      data: Updateable<InsertObject<DB, TableName>>
    ) {

      // TODO use with and select with limit 1
      const item = await this
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

      return item && this.createInstance(item);
    }

    static async getOneByFieldsAndUpdate(
      fields: Partial<{
        [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]> | SelectType<Table[ColumnName]>[];
      }>, 
      data: Updateable<InsertObject<DB, TableName>>,
      error: typeof NoResultError = NoResultError,
    ) {

      // TODO use with and select with limit 1
      const item = await this
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

      return this.createInstance(item);
    }

    static findByIdAndUpdate(id: SelectType<IdColumn>, data: Updateable<InsertObject<DB, TableName>>) {
      return this.findOneAndUpdate(this.id, id, data);
    }
    
    static async getOneAndUpdate<ColumnName extends keyof Table & string>(
      column: ColumnName,
      value: SelectType<Table[ColumnName]>,
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

      return this.createInstance(item);
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
      error: typeof NoResultError = NoResultError,
    ) {
      const processedValues = await this.beforeInsert(values);

      const item = await this
        .insertInto()
        .values(processedValues)
        .returningAll()
        .executeTakeFirstOrThrow(error);

      return this.createInstance(item);
    }
    
    static async deleteOne<ColumnName extends keyof Table & string>(
      column: ColumnName,
      value: SelectType<Table[ColumnName]>,
      error: typeof NoResultError = NoResultError,
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
      error: typeof NoResultError = NoResultError,
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
  }
}

export type Model<TBase extends Constructor, DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string> = ReturnType<typeof model<TBase, DB, TableName, IdColumnName>>;
