import { sql, type ExpressionBuilder } from 'kysely';
import { type UpdateExpression } from 'kysely/dist/cjs/parser/update-set-parser';
import { type Model } from './model';

export default function updatedAt<
DB, 
TableName extends keyof DB & string, 
IdColumnName extends keyof DB[TableName] & string, 
TBase extends Model<DB, TableName, IdColumnName>,
>(
  Base: TBase, 
  field: keyof DB[TableName] & string,
) {
  return class UpdatedAt extends Base  {
    static processDataBeforeUpdate(data: UpdateExpression<DB, TableName, TableName>) {
      if (typeof data === 'function') {
        return (eb: ExpressionBuilder<DB, TableName>) => ({
          [field]: sql`CURRENT_TIMESTAMP`,
          ...data(eb),
        });
      }

      return {
        [field]: sql`CURRENT_TIMESTAMP`,
        ...data,
      };
    }
  };
}
