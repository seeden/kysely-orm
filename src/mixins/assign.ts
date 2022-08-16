import { type Selectable } from 'kysely';

export default function assign<Table>() {
  return class TableClass {
    constructor(data: Selectable<Table>) {
      Object.assign(this, data);
    }
  } as {
    new (arg: Selectable<Table>): Selectable<Table>;
  };
}

export type Assign<Table> = ReturnType<typeof assign<Table>>;
