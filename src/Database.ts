import { Kysely, PostgresDialect, CamelCasePlugin } from 'kysely';
import { Pool } from 'pg';
import { AsyncLocalStorage } from 'node:async_hooks';

export type DatabaseConfig<DB> = {
  connectionString: string;
} | {
  kysely: Kysely<DB>;
  asyncLocalDb: AsyncLocalStorage<Kysely<DB>>;
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
  private kysely: Kysely<DB>;
  private asyncLocalDb = new AsyncLocalStorage<TransactionState<DB>>();

  constructor(config: DatabaseConfig<DB>) {
    if ('kysely' in config) {
      this.kysely = config.kysely;

    } else {
      const { connectionString } = config;
      this.kysely = new Kysely<DB>({
        dialect: new PostgresDialect({
          pool: new Pool({
            connectionString,
          }),
        }),
        plugins: [
          new CamelCasePlugin(),
        ],
        log(event) {
          if (event.level === 'query') {
            console.log(event?.query?.sql)
            console.log(event?.query?.parameters)
          }
        },
      });
    }    
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

  transaction<Type>(callback: TransactionCallback<DB, Type>) {
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

    return this.db.transaction().execute<Type>(async (transaction) => {
      const transactionState: TransactionState<DB> = {
        transaction,
        committed: false,
        afterCommit: [],
      };

      const response = await new Promise<Type>((resolve, reject) => {
        this.asyncLocalDb.run(transactionState, async () => {
          try {
            const result = await callback({
              transaction,
              afterCommit(callback: AfterCommitCallback) {
                transactionState.afterCommit.push(callback);
              },
            });
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            transactionState.committed = true;
          }
        });
      });

      for (const afterCommit of transactionState.afterCommit) {
        await afterCommit();
      }

      return response;
    });
  }
}
