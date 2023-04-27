import { type SelectType, Selectable } from 'kysely';
import { type Model } from './model';

type ParseCallback<IdType> = (id: string) => IdType;

function encodeBase64(i: string): string {
  return Buffer.from(i, 'utf8').toString('base64');
}

function decodeBase64(i: string): string {
  return Buffer.from(i, 'base64').toString('utf8');
}

function fromGlobalId<IdType>(globalId: string, parse: ParseCallback<IdType>): {
  type: string;
  id: ReturnType<typeof parse>;
} {
  const unbasedGlobalId = decodeBase64(globalId);
  const [type, unparsedId] = unbasedGlobalId.split(':');

  if (!type || !unparsedId) {
    throw new Error('Node type or id is not defined in globalId');
  }

  const id = parse(unparsedId);

  return {
    type,
    id,
  };
}

export function decodeTypeFromGlobalId(globalId: string) {
  const unbasedGlobalId = decodeBase64(globalId);
  const [type] = unbasedGlobalId.split(':');

  if (!type) {
    throw new Error('Node type is not defined in globalId');
  }

  return type;
}

export default function globalId<
  DB, 
  TableName extends keyof DB & string, 
  IdColumnName extends keyof DB[TableName] & string, 
  TBase extends Model<DB, TableName, IdColumnName>
>(
  Base: TBase,
  parseId: ParseCallback<SelectType<DB[TableName][IdColumnName]>>,
  type?: string,
) {
  type Table = DB[TableName];
  
  return class GlobalId extends Base {
    static readonly globalIdType = type || Base.table;

    static getGlobalId(id: SelectType<DB[TableName][IdColumnName]>): string {
      if (typeof id === 'string' || typeof id === 'number') {
        return encodeBase64([this.globalIdType, id.toString()].join(':'));
      }
      
      throw new Error('Id is not defined');
    }

    static getLocalId(globalId: string) {
      const { type, id } = fromGlobalId(globalId, parseId);

      if (this.globalIdType !== type) {
        throw new Error(`Model ${this.globalIdType} is not model ${type}`);
      }

      return id;
    }

    static findByGlobalId(globalId: string) {
      const id = this.getLocalId(globalId);
      return this.findById(id);
    }

    static getByGlobalId(globalId: string) {
      const id = this.getLocalId(globalId);
      return this.getById(id);
    }

    static findByGlobalIds(globalIds: string[]) {
      const ids = globalIds.map((globalId) => this.getLocalId(globalId));
      return this.findByIds(ids);
    }
  }
}

