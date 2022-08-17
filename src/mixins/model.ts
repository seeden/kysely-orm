import { type SelectType, type Updateable, type InsertObject, type Insertable, NoResultError } from 'kysely';
import type Database from '../Database';
import { type TransactionCallback } from '../Database';
import type Constructor from '../@types/Constructor';

export default function model<TBase extends Constructor, DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string>(Base: TBase, db: Database<DB>, table: TableName, id: IdColumnName) {
  return class Model extends Base {
    static db: Database<DB> = db;
    static table: TableName = table;
    static id: IdColumnName = id;

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

    static async beforeInsert(data: Insertable<DB[TableName]>) {
      return data;
    }
  
    static async beforeUpdate(data: Updateable<InsertObject<DB, TableName>>) {
      return data;
    }

    static isolate() {
      return class extends this {};
    }

    static createInstance<Instance extends typeof Model, Data>(this: Instance, data: Data) {
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

      return item && this.createInstance(item);
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

      return this.createInstance(item);
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

      return item && this.createInstance(item);
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

      return this.createInstance(item);
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

      return this.createInstance(item);
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
}

export type Model<TBase extends Constructor, DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string> = ReturnType<typeof model<TBase, DB, TableName, IdColumnName>>;


export type ModelMixinReturn<TBase extends Constructor, DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string> = Constructor<TBase & { 
  db: Database<DB>,
  table: TableName,
  id: IdColumnName,
}>;
