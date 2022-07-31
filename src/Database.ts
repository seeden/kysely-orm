import { Kysely, PostgresDialect, CamelCasePlugin } from 'kysely';
import { Pool } from 'pg';

export type DatabaseConfig<DB> = {
  connectionString: string;
} | {
  db: Kysely<DB>;
};

export default class Database<DB> {
  readonly db: Kysely<DB>;

  constructor(config: DatabaseConfig<DB>) {
    if ('db' in config) {
      this.db = config.db;
    } else {
      const { connectionString } = config;

      this.db = new Kysely<DB>({
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

  transaction<Type>(callback: (db: TransactionDatabase<DB>) => Promise<Type>) {
    return this.db.transaction().execute<Type>((trx) => {
      const dbTrx = new TransactionDatabase<DB>({
        db: trx,
      });


      return dbTrx.execute<Type>(callback);
    });
  }
}

class TransactionDatabase<DB> extends Database<DB> {
  private isTransacting: boolean = true;


  async execute<Type>(callback: (db: TransactionDatabase<DB>) => Promise<Type>) {
    if (!this.isTransacting) {
      throw new Error('Cannot execute transaction outside of transaction');
    }

    try {
      return await callback(this);
    } finally {
      this.isTransacting = false;
    }
  }

  selectFrom<TableName extends keyof DB & string>(table: TableName) {
    if (!this.isTransacting) {
      throw new Error('Cannot start transaction outside of transaction');
    }
    return super.selectFrom(table);
  }

  insertInto<TableName extends keyof DB & string>(table: TableName) {
    if (!this.isTransacting) {
      throw new Error('Cannot start transaction outside of transaction');
    }
    return super.insertInto(table);
  }

  updateTable<TableName extends keyof DB & string>(table: TableName) {
    if (!this.isTransacting) {
      throw new Error('Cannot start transaction outside of transaction');
    }
    return super.updateTable(table);
  }

  deleteFrom<TableName extends keyof DB & string>(table: TableName) {
    if (!this.isTransacting) {
      throw new Error('Cannot start transaction outside of transaction');
    }
    return super.deleteFrom(table);
  }

  transaction<Type>(callback: (db: TransactionDatabase<DB>) => Promise<Type>): Promise<Type> {
    if (!this.isTransacting) {
      throw new Error('Cannot start transaction outside of transaction');
    }

    return callback(this);       
  }
}
