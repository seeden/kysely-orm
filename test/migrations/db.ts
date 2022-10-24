import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
    .addColumn('email', 'varchar(255)', (col) => col.unique())
    .addColumn('name', 'varchar(255)')
    .addColumn('password', 'varchar(255)')
    .addColumn('createdAt', 'datetime', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .addColumn('updatedAt', 'datetime', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .addColumn('username', 'varchar(255)', (col) => col.notNull())
    .addColumn('followersCount', 'integer', (col) => col.unsigned().notNull().defaultTo(0))
    .execute()

    /*
  await db.schema
    .createTable('pet')
    .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull().unique())
    .addColumn('owner_id', 'integer', (col) =>
      col.references('person.id').onDelete('cascade').notNull()
    )
    .addColumn('species', 'varchar', (col) => col.notNull())
    .execute()

  await db.schema
    .createIndex('pet_owner_id_index')
    .on('pet')
    .column('owner_id')
    .execute()
  */
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute()
  // await db.schema.dropTable('person').execute()
}