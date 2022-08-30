import type RelationType from '../constants/RelationType';
import type ReferenceExpression from './ReferenceExpression';

export type OneRelation<
  DB, 
  FromTableName extends keyof DB & string,
  FromColumnName extends keyof DB[FromTableName] & string,
  ToTableName extends keyof DB & string,
  ToColumnName extends keyof DB[ToTableName] & string,
> = {
  type: RelationType.BelongsToOneRelation | RelationType.HasOneRelation | RelationType.HasOneThroughRelation;
  from: ReferenceExpression<DB, FromTableName, FromColumnName>; 
  to: ReferenceExpression<DB, ToTableName, ToColumnName>;
};

export type ManyRelation<
  DB, 
  FromTableName extends keyof DB & string,
  FromColumnName extends keyof DB[FromTableName] & string,
  ToTableName extends keyof DB & string,
  ToColumnName extends keyof DB[ToTableName] & string,
> = {
  type: RelationType.HasManyRelation | RelationType.BelongsToManyRelation | RelationType.HasManyThroughRelation;
  from: ReferenceExpression<DB, FromTableName, FromColumnName>; 
  to: ReferenceExpression<DB, ToTableName, ToColumnName>;
};

export type AnyRelation<
  DB, 
  FromTableName extends keyof DB & string,
  FromColumnName extends keyof DB[FromTableName] & string,
  ToTableName extends keyof DB & string,
  ToColumnName extends keyof DB[ToTableName] & string,
> = OneRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName> | ManyRelation<DB, FromTableName, FromColumnName, ToTableName, ToColumnName>;

