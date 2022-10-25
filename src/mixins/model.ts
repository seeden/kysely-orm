import { type SelectType, type Updateable, type InsertObject, type Insertable, type Selectable, NoResultError, type UpdateQueryBuilder, type SelectQueryBuilder, type DeleteQueryBuilder, type DeleteResult, type UpdateResult, type RawBuilder, sql, type MutationObject, type OnConflictDatabase, type OnConflictTables, OnConflictUpdateBuilder } from 'kysely';
import { type CommonTableExpression } from 'kysely/dist/cjs/parser/with-parser';
import type Database from '../Database';
import { type TransactionCallback } from '../Database';
import type ReferenceExpression from '../@types/ReferenceExpression';
import { type OneRelation, type AnyRelation, type ManyRelation } from '../@types/Relation';
import RelationType from '../constants/RelationType';

export default function model<
  DB,
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string,
>(
  db: Database<DB>,
  table: TableName,
  id: IdColumnName,
  noResultError: typeof NoResultError = NoResultError,
) {
  type Table = DB[TableName];
  type IdColumn = Table[IdColumnName];
  type Data = Selectable<Table>;
  type Id = Readonly<SelectType<IdColumn>>;
  return class Model {
    static readonly db: Database<DB> = db;
    static readonly table: TableName = table;
    static readonly id: IdColumnName = id;
    static readonly noResultError: typeof NoResultError = noResultError;

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
  
    static async beforeInsert(data: Readonly<Insertable<Table>>) {
      return {
        ...data
      } as Insertable<Table>;
    }

    static async beforeUpdate(data: Readonly<Updateable<InsertObject<DB, TableName>>>) {
      return {
        ...data
      } as Updateable<InsertObject<DB, TableName>>;
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

    static with<Name extends string, Expression extends CommonTableExpression<DB, Name>>(name: Name, expression: Expression) {
      return this.db.with(name, expression);
    }

    static async find<ColumnName extends keyof Table & string>(
      column: ColumnName,
      values: Readonly<SelectType<Table[ColumnName]>[]>,
      func?: (qb: SelectQueryBuilder<DB, TableName, {}>) => SelectQueryBuilder<DB, TableName, {}>,
    ) {
      return this
        .selectFrom()
        .selectAll()
        .where(this.ref(column as string), 'in', values)
        .if(!!func, (qb) => func?.(qb as unknown as SelectQueryBuilder<DB, TableName, {}>) as unknown as typeof qb)
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
        .where(this.ref(column as string), '=', value)
        .if(!!func, (qb) => func?.(qb as unknown as SelectQueryBuilder<DB, TableName, {}>) as unknown as typeof qb)
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
            if (Array.isArray(value)) {
              currentQuery = currentQuery.where(this.ref(column as string), 'in', value);
            } else {
              currentQuery = currentQuery.where(this.ref(column as string), '=', value);
            }
          }
          return currentQuery;
        })
        .if(!!func, (qb) => func?.(qb as unknown as SelectQueryBuilder<DB, TableName, {}>) as unknown as typeof qb)
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
            if (Array.isArray(value)) {
              currentQuery = currentQuery.where(this.ref(column as string), 'in', value);
            } else {
              currentQuery = currentQuery.where(this.ref(column as string), '=', value);
            }
          }
          return currentQuery;
        })
        .if(!!func, (qb) => func?.(qb as unknown as SelectQueryBuilder<DB, TableName, {}>) as unknown as typeof qb)
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
            if (Array.isArray(value)) {
              currentQuery = currentQuery.where(this.ref(column as string), 'in', value);
            } else {
              currentQuery = currentQuery.where(this.ref(column as string), '=', value);
            }
          }
          return currentQuery;
        })
        .selectAll()
        .if(!!func, (qb) => func?.(qb as unknown as SelectQueryBuilder<DB, TableName, {}>) as unknown as typeof qb)
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
        .where(this.ref(column as string), '=', value)
        .if(!!func, (qb) => func?.(qb as unknown as SelectQueryBuilder<DB, TableName, {}>) as unknown as typeof qb)
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
      data: Readonly<Updateable<InsertObject<DB, TableName>>>,
      func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    ) {
      const processedData = await this.beforeUpdate(data);

      return this
        .updateTable()
        .set(processedData)
        .where(this.ref(column as string), '=', value)
        .if(!!func, (qb) => func?.(qb as unknown as UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) as unknown as typeof qb)
        .returningAll()
        .executeTakeFirst();
    }

    static async findByFieldsAndUpdate(
      fields: Readonly<Partial<{
        [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]> | SelectType<Table[ColumnName]>[];
      }>>, 
      data: Readonly<Updateable<InsertObject<DB, TableName>>>,
      func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    ) {
      const processedData = await this.beforeUpdate(data);

      return this
        .updateTable()
        .set(processedData)
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
        .if(!!func, (qb) => func?.(qb as unknown as UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) as unknown as typeof qb)
        .returningAll()
        .execute();
    }

    static async findOneByFieldsAndUpdate(
      fields: Readonly<Partial<{
        [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]> | SelectType<Table[ColumnName]>[];
      }>>, 
      data: Readonly<Updateable<InsertObject<DB, TableName>>>,
      func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    ) {
      const processedData = await this.beforeUpdate(data);
      // TODO use with and select with limit 1
      return this
        .updateTable()
        .set(processedData)
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
        .if(!!func, (qb) => func?.(qb as unknown as UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) as unknown as typeof qb)
        .returningAll()
        .executeTakeFirst();
    }

    static async getOneByFieldsAndUpdate(
      fields: Readonly<Partial<{
        [ColumnName in keyof Table & string]: SelectType<Table[ColumnName]> | SelectType<Table[ColumnName]>[];
      }>>, 
      data: Readonly<Updateable<InsertObject<DB, TableName>>>,
      func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
      error: typeof NoResultError = this.noResultError,
    ) {
      const processedData = await this.beforeUpdate(data);

      // TODO use with and select with limit 1
      return this
        .updateTable()
        .set(processedData)
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
        .if(!!func, (qb) => func?.(qb as unknown as UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) as unknown as typeof qb)
        .returningAll()
        .executeTakeFirstOrThrow(error);
    }

    static findByIdAndUpdate(
      id: SelectType<IdColumn>, 
      data: Updateable<InsertObject<DB, TableName>>,
      func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    ) {
      return this.findOneAndUpdate(this.id, id, data, func);
    }
    
    static async getOneAndUpdate<ColumnName extends keyof Table & string>(
      column: ColumnName,
      value: Readonly<SelectType<Table[ColumnName]>>,
      data: Readonly<Updateable<InsertObject<DB, TableName>>>,
      func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
      error: typeof NoResultError = this.noResultError,
    ) {
      const processedData = await this.beforeUpdate(data);

      return this
        .updateTable()
        .set(processedData)
        .where(this.ref(column as string), '=', value)
        .if(!!func, (qb) => func?.(qb as unknown as UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) as unknown as typeof qb)
        .returningAll()
        .executeTakeFirstOrThrow(error);
    }

    static getByIdAndUpdate(
      id: SelectType<IdColumn>, 
      data: Updateable<InsertObject<DB, TableName>>,
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
        .where(this.ref(column as string), '=', value)
        .selectAll()
        .forUpdate()
        .executeTakeFirst();
    }

    static lockById(id: SelectType<IdColumn>) {
      return this.lock(this.id, id);
    }
    
    static async insert(
      values: Readonly<Insertable<Table>>,
      error: typeof NoResultError = this.noResultError,
    ) {
      const processedValues = await this.beforeInsert(values);

      return this
        .insertInto()
        .values(processedValues)
        .returningAll()
        .executeTakeFirstOrThrow(error);
    }

    static async upsert(
      values: Readonly<Insertable<Table>>,
      upsertValues: MutationObject<OnConflictDatabase<DB, TableName>, OnConflictTables<TableName>, OnConflictTables<TableName>>,
      conflictColumns: Readonly<(keyof Table & string)[]> | Readonly<keyof Table & string>,
      error: typeof NoResultError = this.noResultError,
    ) {
      const processedInsertValues = await this.beforeInsert(values);
      // const processedUpdateValues = await this.beforeUpdate(upsertValues);

      return this
        .insertInto()
        .values(processedInsertValues)
        .onConflict((oc) => oc
          .columns(Array.isArray(conflictColumns) ? conflictColumns : [conflictColumns])
          .doUpdateSet(upsertValues) as OnConflictUpdateBuilder<DB, TableName>
        )
        .returningAll()
        .executeTakeFirstOrThrow(error);
    }

    static async insertIfNotExists(
      values: Readonly<Insertable<Table>>,
      conflictColumns: Readonly<(keyof Table & string)[]> | Readonly<keyof Table & string>,
      error: typeof NoResultError = this.noResultError,
    ) {
      const processedInsertValues = await this.beforeInsert(values);

      return this
        .insertInto()
        .values(processedInsertValues)
        .onConflict((oc) => oc
          .columns(Array.isArray(conflictColumns) ? conflictColumns : [conflictColumns])
          .doUpdateSet({
            [id]: (eb: any) => eb.ref(`excluded.${id}`)
          } as MutationObject<OnConflictDatabase<DB, TableName>, OnConflictTables<TableName>, OnConflictTables<TableName>>) as OnConflictUpdateBuilder<DB, TableName>
        )
        .returningAll()
        .executeTakeFirstOrThrow(error);
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
        .where(this.ref(column as string), '=', value)
        .if(!!func, (qb) => func?.(qb as unknown as DeleteQueryBuilder<DB, TableName, DeleteResult>) as unknown as typeof qb)
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
              currentQuery = currentQuery.where(this.ref(column as string), 'in', value);
            } else {
              currentQuery = currentQuery.where(this.ref(column as string), '=', value);
            }
          }
          return currentQuery;
        })
        .if(!!func, (qb) => func?.(qb as unknown as DeleteQueryBuilder<DB, TableName, DeleteResult>) as unknown as typeof qb)
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
        .where(this.ref(column as string), 'in', values)
        .if(!!func, (qb) => func?.(qb as unknown as DeleteQueryBuilder<DB, TableName, DeleteResult>) as unknown as typeof qb)
        .executeTakeFirstOrThrow(error);

      return numDeletedRows;
    }

    static deleteById(id: SelectType<IdColumn>) {
      return this.deleteOne(this.id, id);
    }

    static findByIdAndIncrement(
      id: Id, 
      columns: Partial<Record<keyof Table, number>>,
      func?: (qb: UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) => UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
      error: typeof NoResultError = this.noResultError,
    ) {
      const setData: Updateable<InsertObject<DB, TableName>> = {};

      Object.keys(columns).forEach((column) => {
        const value = columns[column as keyof Table] as number;
        const correctColumn = column as keyof Updateable<InsertObject<DB, TableName>>;

        setData[correctColumn] = sql`${this.ref(column as string)} + ${value}` as any;
      });

      return this
        .updateTable()
        .set(setData)
        .where(this.ref(this.id), '=', id)
        .if(!!func, (qb) => func?.(qb as unknown as UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>) as unknown as typeof qb)
        .returningAll()
        .executeTakeFirstOrThrow(error);
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

    static jsonbIncrement(column: keyof Table & string, data: Record<string, number>) {
      const entries = Object.entries(data);
      if (!entries.length) {
        throw new Error('Data is empty');
      }

      const [[key, value], ...rest] = entries;

      let update: RawBuilder<string> = sql`jsonb_set(
        COALESCE(${this.ref(column)}, '{}'), 
        ${sql.literal(`{${key}}`)}, 
        (COALESCE(${this.ref(column)}->>${sql.literal(key)}, '0')::int + ${value})::text::jsonb
      )`;

      rest.forEach(([key, value]) => {
        update = sql`jsonb_set(
          ${update}, 
          ${sql.literal(`{${key}}`)}, 
          (COALESCE(${this.ref(column)}->>${sql.literal(key)}, '0')::int + ${value})::text::jsonb
        )`;
      });
    
      return update;
    }
  }
}

export type Model<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string
> = ReturnType<typeof model<DB, TableName, IdColumnName>>;
