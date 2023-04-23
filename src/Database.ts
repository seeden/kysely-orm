import { Kysely, CamelCasePlugin, NoResultError, type LogEvent, type Dialect, SqliteDialect, MysqlDialect, PostgresDialect } from 'kysely';
import { type CommonTableExpression } from 'kysely/dist/cjs/parser/with-parser';
import { AsyncLocalStorage } from 'node:async_hooks';
import model from './mixins/model';

export type DatabaseConfig<DB> = {
  isolated?: boolean;
  log?: (event: LogEvent) => void;
  debug?: boolean;
  dialect: Dialect;
};

type AfterCommitCallback = () => Promise<any>;

type TransactionState<DB> = {
  transaction: Kysely<DB>;
  committed: boolean;
  afterCommit: AfterCommitCallback[];
};

type TransactionResponse<DB> = { 
  transaction: Kysely<DB>;
  afterCommit: (callback: AfterCommitCallback) => void;
};

export type TransactionCallback<DB, Type> = (trx: TransactionResponse<DB>) => Promise<Type>;

export default class Database<DB> {
  private dialect: Dialect;
  private kysely: Kysely<DB>;
  private asyncLocalDb = new AsyncLocalStorage<TransactionState<DB>>();
  readonly isolated;
  readonly log;
  readonly debug;

  static readonly HasManyRelation = 1;

  constructor(config: DatabaseConfig<DB>) {
    const { dialect, isolated = false, log, debug = false } = config;

    this.isolated = isolated;
    this.log = log;
    this.debug = debug;
    this.dialect = dialect;

    this.kysely = new Kysely<DB>({
      dialect,
      plugins: [
        new CamelCasePlugin(),
      ],
      log: (event) => {
        if (this.debug) {
          if (event.level === 'query') {
            console.log(event?.query?.sql)
            console.log(event?.query?.parameters)
          }
        }

        this.log?.(event);
      },
    });  
  }

  get isSqlite() {
    return this.dialect instanceof SqliteDialect;
  }

  get isMysql() {
    return this.dialect instanceof MysqlDialect;
  }

  get isPostgres() {
    return this.dialect instanceof PostgresDialect;
  }

  model<
    TableName extends keyof DB & string, 
    IdColumnName extends keyof DB[TableName] & string,
  >(table: TableName, id: IdColumnName, error?: typeof NoResultError) {
    return model(this, table, id, error);
  }

  get dynamic() {
    return this.db.dynamic;
  }

  get fn() {
    return this.db.fn;
  }

  get isTransaction() {
    return this.db.isTransaction;
  }

  get db() {
    const transactionState = this.asyncLocalDb.getStore();
    if (!transactionState) {
      return this.kysely;
    }

    const { transaction, committed } = transactionState;
    if (committed) {
      throw new Error('Transaction is already committed');
    }

    return transaction;
  }

  selectFrom<TableName extends keyof DB & string>(table: TableName) {
    return this.db.selectFrom(table);
  }

  insertInto<TableName extends keyof DB & string>(table: TableName) {
    return this.db.insertInto(table);
  }

  updateTable<TableName extends keyof DB & string>(table: TableName) {
    return this.db.updateTable(table);
  }

  deleteFrom<TableName extends keyof DB & string>(table: TableName) {
    return this.db.deleteFrom(table);
  }

  with<Name extends string, Expression extends CommonTableExpression<DB, Name>>(name: Name, expression: Expression) {
    return this.db.with(name, expression);
  }

  destroy() {
    return this.db.destroy();
  }

  async transaction<Type>(callback: TransactionCallback<DB, Type>) {
    const transactionState = this.asyncLocalDb.getStore();
    if (transactionState && !transactionState.committed) {
      console.log('you are already in transaction. using current transaction instance');
      return callback({
        transaction: transactionState.transaction,
        afterCommit(callback: AfterCommitCallback) {
          transactionState.afterCommit.push(callback);
        },
      });
    }

    const afterCommit: AfterCommitCallback[]  = [];

    const result = await this.db.transaction().execute<Type>(async (transaction) => {
      const newTransactionState: TransactionState<DB> = {
        transaction,
        committed: false,
        afterCommit,
      };

      return new Promise<Type>((resolve, reject) => {
        this.asyncLocalDb.run(newTransactionState, async () => {
          try {
            const result = await callback({
              transaction,
              afterCommit(callback: AfterCommitCallback) {
                newTransactionState.afterCommit.push(callback);
              },
            });
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            newTransactionState.committed = true;
          }
        });
      });
    });

    for (const afterCommitCallback of afterCommit) {
      await afterCommitCallback();
    }

    return result;
  }
}
