import { type SelectType } from 'kysely';
import type Model from '../Model';

function base64(i: string): string {
  return Buffer.from(i, 'utf8').toString('base64');
}

function unbase64(i: string): string {
  return Buffer.from(i, 'base64').toString('utf8');
}

function fromGlobalId<IdType>(globalId: string): {
  type: string;
  id: string;
} {
  const unbasedGlobalId = unbase64(globalId);
  const delimiterPos = unbasedGlobalId.indexOf(':');

  const type = unbasedGlobalId.substring(0, delimiterPos);
  const id: string | number = unbasedGlobalId.substring(delimiterPos + 1);

  if (!type || !id) {
    throw new Error('Node type or id is not defined in globalId');
  }

  return {
    type,
    id,
  };
}

export default function globalId<DB, TableName extends keyof DB & string, IdColumnName extends keyof DB[TableName] & string>(ModelClass: typeof Model<DB, TableName, IdColumnName>) {
  type IdColumn = SelectType<DB[TableName][IdColumnName]>;

  return class extends ModelClass {
    getGlobalId(data: DB[TableName]): string {
      const value = data[this.id];
      if (typeof value === 'string' || typeof value === 'number') {
        return base64([this.table, value.toString()].join(':'));
      }
      
      throw new Error('Id is not defined');
    }

    getLocalId(globalId: string) {
      const { type, id } = fromGlobalId(globalId);

      if (this.table !== type) {
        throw new Error(`Model ${this.table} is not model ${type}`);
      }

      return id;
    }

    findByGlobalId(globalId: string) {
      const id = this.getLocalId(globalId) as IdColumn;
      return this.findById(id);
    }

    getByGlobalId(globalId: string) {
      const id = this.getLocalId(globalId) as IdColumn;
      return this.getById(id);
    }

    findByGlobalIds(globalIds: string[]) {
      const ids = globalIds.map((globalId) => this.getLocalId(globalId) as IdColumn);
      return this.findByIds(ids);
    }
  };
}
  