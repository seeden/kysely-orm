import {type SelectType, type Updateable, type InsertObject, type Insertable, type Selectable, NoResultError } from 'kysely';
import type Database from '../Database';
import { type TransactionCallback } from '../Database';
import type Constructor from '../@types/Constructor';
import type ReferenceExpression from '../@types/ReferenceExpression';
import { type OneRelation, type AnyRelation, type ManyRelation } from '../@types/Relation';
import RelationType from '../constants/RelationType';

export default function model<
  TBase extends Constructor, 
  DB,
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string,
>(
  Base: TBase, 
  db: Database<DB>, 
  table: TableName, 
  id: IdColumnName, 
  NotFoundError: typeof NoResultError = NoResultError,
) {
  type Table = DB[TableName];
  type IdColumn = Table[IdColumnName];
  type Data = Selectable<Table>;
  
  return class Model extends Base {
    static readonly db: Database<DB> = db;
    static readonly table: TableName = table;
    static readonly id: IdColumnName = id;

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
      const { type, from, to } = relation;
      const [fromTable, fromColumn] = from.split('.') as [FromTableName, FromColumnName];
      const [toTable, toColumn] = to.split('.') as [ToTableName, ToColumnName];

      const oneResult = type === RelationType.HasOneRelation || type === RelationType.BelongsToOneRelation;

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
      const { type, from, to } = relation;
      const [fromTable, fromColumn] = from.split('.') as [FromTableName, FromColumnName];
      const [toTable, toColumn] = to.split('.') as [ToTableName, ToColumnName];

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
      const [fromTable, fromColumn] = from.split('.') as [FromTableName, FromColumnName];
      const [toTable, toColumn] = to.split('.') as [ToTableName, ToColumnName];

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
}

export type Model<TBase extends Constructor, DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string> = ReturnType<typeof model<TBase, DB, TableName, IdColumnName>>;
