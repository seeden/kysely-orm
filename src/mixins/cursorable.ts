import { type SelectQueryBuilder, sql, type Selectable } from 'kysely';
import { type Model } from './model';

type ColumnSortOptions = { 
  direction?: 'ASC' | 'DESC';
  reversible?: boolean;
  timestamp?: boolean;
  modifier?: string;
};

type ColumnSort<Table> = [keyof Table & string, ColumnSortOptions];
type SortKeys<Table> = Record<string, ColumnSort<Table>[]>;

type Config<Table, TSortKeys extends SortKeys<Table>> = {
  sortKeys: TSortKeys;
  max?: number;
  limit?: number;
  sortKey?: keyof TSortKeys;
};

export default function cursorable<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Model<DB, TableName, IdColumnName>,
>(
  Base: TBase,
  config: Config<DB[TableName], SortKeys<DB[TableName]>>,
) {
  const { sortKeys, max = 100, limit: defaultLimit = 10, sortKey: defaultSortKey } = config;
  type Table = DB[TableName];
  type SortKeyName = keyof typeof sortKeys;

  type CursorPart = {
    column: keyof Table & string;
    value: any;
    direction: 'ASC' | 'DESC';
    reversible: boolean;
    modifier?: string;
    timestamp?: boolean;
  };

  type CursorableOptions = {
    sortKey?: keyof typeof config.sortKeys; 
    func?: (qb: SelectQueryBuilder<DB, TableName, {}>) => SelectQueryBuilder<DB, TableName, {}>,
    oneMore?: boolean,
  } & ({
    first?: number;
    after?: string;
  } | {
    last?: number;
    before?: string;
  });

  if (!sortKeys) {
    throw new Error('sortKeys are not defined');
  }

  function getSortKeyConfig(sortKeyName?: SortKeyName) {
    if (!sortKeyName) {
      throw new Error('Sort key is not defined');
    }

    if (!(sortKeyName in sortKeys)) {
      throw new Error(`Sort key ${sortKeyName} is not defined`);
    }

    return sortKeys[sortKeyName];
  }

  function parseCursor(sortKeyName: SortKeyName, cursor?: string): CursorPart[] {
    if (!cursor) {
      throw new Error('Cursor is not defined');
    }

    const sortKeyConfig = getSortKeyConfig(sortKeyName);
    const values = JSON.parse(Buffer.from(cursor, 'base64').toString());

    if (values.length !== sortKeyConfig.length) {
      throw new Error('Invalid cursor');
    }

    return sortKeyConfig.map(([column, { direction = 'ASC', reversible = false, timestamp = false, modifier }], index) => ({
      column,
      value: values[index],
      direction,
      reversible,
      modifier,
      timestamp,
    }));
  }

  function makeCursor(obj: Selectable<Table>, sortKeyName: SortKeyName) {
    const sortKeyConfig = getSortKeyConfig(sortKeyName);

    const values = sortKeyConfig.map(([column]) => obj[column as keyof Selectable<Table>]);

    return Buffer.from(JSON.stringify(values)).toString('base64');
  }

  function isQueryReversed(options: CursorableOptions) {
    return 'last' in options || 'before' in options;
  }

  function getLimit(options: CursorableOptions) {
    if ('first' in options) {
      return options.first ?? defaultLimit;
    }

    if ('last' in options) {
      return options.last ?? defaultLimit;
    }

    return defaultLimit;
  }

  function getCursor(options: CursorableOptions) {
    if ('last' in options || 'before' in options) {
      return options.before;
    }

    if ('after' in options) {
      return options.after;
    }

    return undefined;
  }

  function getEqualOperator(cursorPart: CursorPart, isReversed?: boolean) {
    const { direction, reversible } = cursorPart;

    if (isReversed && reversible) {
      return direction === 'ASC' ? sql`<` : sql`>`;
    }

    return direction === 'ASC' ? sql`>` : sql`<`;
  }

  function getDirection(direction: 'ASC' | 'DESC' = 'ASC' , reversible: boolean = false, isReversed: boolean = false) {
    const sqlDirection = direction.toLowerCase() as 'asc' | 'desc'

    if (isReversed && reversible) {
      return sqlDirection === 'asc' ? 'desc' : 'asc';
    }

    return sqlDirection;
  }

  return class Cursorable extends Base  {
    static getCursorableQuery(options: CursorableOptions) {
      const { sortKey = defaultSortKey, func, oneMore } = options;
      if (!sortKey) {
        throw new Error('Sort key is not defined');
      }

      const isReversed = isQueryReversed(options);
      const limit = getLimit(options);
      const cursor = getCursor(options);

      if (limit < 0) {
        throw new Error('Limit must be positive');
      }

      if (max && limit && limit > max) {
        throw new Error(`Limit ${limit} is greater than max ${max}`);
      }

      const sortKeyConfig = getSortKeyConfig(sortKey);

      let query = this
        .selectFrom()
        .limit(limit + (oneMore ? 1 : 0))
        .$if(!!func, (qb) => func?.(qb as unknown as SelectQueryBuilder<DB, TableName, any>) as unknown as typeof qb)
        .$if(!!cursor, (qbIf) => qbIf.where(({ ref, or, and, cmpr }) => {
          const [first, ...rest] = parseCursor(sortKey, cursor);

          const prepareColumnFromCursorPart = (cursorPart: CursorPart) => {
            const { column, modifier, timestamp } = cursorPart;
    
            const columnRef = sql.ref(`${this.table}.${column}`);
    
            if (modifier && this.db.isPostgres) {
              return sql`${(columnRef)}::${sql.raw(modifier)}`;
            }

            if (timestamp && this.db.isPostgres) { // PG is truncating microseconds
              return sql`date_trunc('milliseconds', ${(columnRef)})`;
            }
      
            return columnRef;
          }

          const startExpression = cmpr(prepareColumnFromCursorPart(first), getEqualOperator(first, isReversed), first.value);

          const processCursorParts = (expression: typeof startExpression, restCursorParts: typeof rest, previousCursorPart: typeof first): typeof startExpression => {
            if (!restCursorParts.length) {
              return expression;
            }

            const [nextCursorPart, ...nextRestCursorParts] = restCursorParts;

            return or([
              expression,
              and([
                cmpr(prepareColumnFromCursorPart(previousCursorPart), '=', previousCursorPart.value),
                processCursorParts(
                  cmpr(prepareColumnFromCursorPart(nextCursorPart), getEqualOperator(nextCursorPart, isReversed), nextCursorPart.value),
                  nextRestCursorParts,
                  nextCursorPart,
                ),
              ]),
            ]);
          };

          return processCursorParts(startExpression, rest, first);
        }));

      sortKeyConfig.forEach(([column, { direction, reversible }]) => {
        query = query.orderBy(this.ref(`${this.table}.${column}`), getDirection(direction, reversible, isReversed));
      });

      return query;
    }

    static async getCursorable(options: CursorableOptions) {
      return this.getCursorableQuery(options).selectAll(this.table as never).execute();
    }

    static async getLazyCursorableConnection(options: CursorableOptions) {
      const { sortKey = defaultSortKey } = options;

      if (!sortKey) {
        throw new Error('Sort key is not defined');
      }

      const prepareData = async () => {
        const limit = getLimit(options);
        const nodes = await this.getCursorable({
          ...options,
          oneMore: true,
        });

        const hasMore = nodes.length > limit;

        const edges = nodes.slice(0, limit).map((node) => ({
          cursor: makeCursor(node as Selectable<Table>, sortKey),
          node,
        }));

        return {
          edges,
          hasMore,
        };
      };

      let dataPromise: ReturnType<typeof prepareData> | undefined;

      function getData() {
        dataPromise = dataPromise ?? prepareData();
        return dataPromise;
      }

      const cursor = getCursor(options);

      return {
        edges: async () => {
          const { edges } = await getData();
          return edges;
        },
        pageInfo: {
          hasPreviousPage: async () => !!cursor,
          hasNextPage: async () => {
            const { hasMore } = await getData();
            return hasMore;
          },
          startCursor: async () => {
            const { edges } = await getData();
            return edges[0]?.cursor;
          },
          endCursor: async () => {
            const { edges } = await getData();
            return edges[edges.length - 1]?.cursor;
          },
        },
        totalCount: async () => {
          const { func } = options;

          const { count } = await this
            .selectFrom()
            .$if(!!func, (qb) => func?.(qb as unknown as SelectQueryBuilder<DB, TableName, {}>) as unknown as typeof qb)
            .select(sql`count(${sql.lit(`${this.table}.${this.id}`)})`.as('count'))
            .executeTakeFirstOrThrow(this.noResultError);

          return Number(count);
        },
      };
    }

    static async getCursorableConnection(options: CursorableOptions) {
      const connection = await this.getLazyCursorableConnection(options);

      return {
        edges: await connection.edges(),
        pageInfo: {
          hasPreviousPage: await connection.pageInfo.hasPreviousPage(),
          hasNextPage: await connection.pageInfo.hasNextPage(),
          startCursor: await connection.pageInfo.startCursor(),
          endCursor: await connection.pageInfo.endCursor(),
        },
        totalCount: await connection.totalCount(),
      };
    }
  }
}

export type Cursorable<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string,
  TBase extends Model<DB, TableName, IdColumnName>
> = ReturnType<typeof cursorable<DB, TableName, IdColumnName, TBase>>;