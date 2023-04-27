import { SqliteDialect, Migrator, FileMigrationProvider } from 'kysely';
import SQLLiteDatabase from 'better-sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
import { Database, RelationType, applyMixins, updatedAt, globalId, slug, cursorable, isolate } from '../src';
import DB, { Users } from './fixtures/DB';

const dialect = new SqliteDialect({
  database: new SQLLiteDatabase('db.test'),
});

const db = new Database<DB>({
  dialect,
  debug: true,
});

const migrator = new Migrator({
  db: db.db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(__dirname, 'migrations'),
  }),
});

enum SortKey {
  CREATED_AT = 'CREATED_AT',
  FOLLOWERS_COUNT = 'FOLLOWERS_COUNT',
}

class Comment extends applyMixins(db, 'comments', 'id')(
  (base) => updatedAt<DB, 'comments', 'id', typeof base>(base, 'updatedAt'),
  (base) => globalId<DB, 'comments', 'id', typeof base>(base, Number),
  (base) => cursorable<DB, 'comments', 'id', typeof base>(base, {
    sortKeys: {
      [SortKey.CREATED_AT]: [
        ['createdAt', { direction: 'ASC', reversible: true, timestamp: true }], 
        ['updatedAt', { direction: 'ASC', reversible: true, timestamp: true }],
        ['id', { direction: 'DESC', reversible: true }]
      ],
    },
    max: 100,
    limit: 10,
  }),
) {
}

class Quiz extends applyMixins(db, 'quizzes', 'id')(
  (base) => updatedAt<DB, 'quizzes', 'id', typeof base>(base, 'updatedAt'),
  (base) => globalId<DB, 'quizzes', 'id', typeof base>(base, Number),
  (base) => cursorable<DB, 'quizzes', 'id', typeof base>(base, {
    sortKeys: {
      [SortKey.CREATED_AT]: [
        ['createdAt', { direction: 'ASC', reversible: true, timestamp: true }], 
        ['id', { direction: 'DESC', reversible: true }]
      ],
    },
    max: 100,
    limit: 10,
  }),
) {
}

class User extends applyMixins(db, 'users', 'id')(
  (base) => updatedAt<DB, 'users', 'id', typeof base>(base, 'updatedAt'),
  (base) => globalId<DB, 'users', 'id', typeof base>(base, Number),
  (base) => cursorable<DB, 'users', 'id', typeof base>(base, {
    sortKeys: {
      [SortKey.CREATED_AT]: [
        ['createdAt', { direction: 'ASC', reversible: true, timestamp: true }], 
        ['id', { direction: 'DESC', reversible: true }]
      ],
      [SortKey.FOLLOWERS_COUNT]: [
        ['followersCount', { direction: 'DESC', reversible: true }], 
        ['createdAt', { direction: 'ASC', reversible: true, timestamp: true }],
        ['id', { direction: 'DESC', reversible: true }],
      ],
    },
    max: 100,
    limit: 10,
  }),
  (base) => slug<DB, 'users', 'id', typeof base>()(base, {
    field: 'username',
    sources: ['name'],
    slugOptions: {
      truncate: 15,
      dictionary: {
        quizana: '',
        admin: '',
      },
    },
  }),
) {

  static relations = {
    comment: this.relation(RelationType.HasOneRelation, 'users.id', 'comments.userId'),
    comments: this.relation(RelationType.HasManyRelation, 'users.id', 'comments.userId'),
  };

  static findByEmail(email: string) {
    return this.findOne('email', email);
  }

  static getByEmail(email: string) {
    return this.getOne('email', email);
  }

  static updateByEmail(email: string, data: Partial<Users>) {
    // return this.updateTable().where('email', '=', email).set(data).execute();
  }

  static testttt() {
    return this.db.selectFrom('users').innerJoin('comments', 'users.id', 'comments.userId').if(!!1, (qb) => qb.where('id', '=', 2)).execute();
  }

  static async widthExample() {
    this.deleteOneByFields({ id: 1 }, (qb) => qb.where('id', '=', 2));

    const connection = await this.getLazyCursorableConnection({
      first: 4,
      sortKey: SortKey.CREATED_AT,
    });

    const edges = await connection.edges();

    console.log('edges', edges);

    // edges[0].node.id;
    //edges[0].node.id2;



    // connection.edges[0].node.name;


    this.findOneAndUpdate('email', 'test', {
      email: 'test',
    }, (qb) => qb.where('id', '=', 1));

    return this.with('comments', (db) => db.selectFrom('comments').where('id', '=', 1)).selectFrom('users').execute();
  }
}

describe('db isolation', () => {
  const isolatedDb = new Database<DB>({
    dialect,
    debug: true,
    isolated: true,
  });

  class NonIsolatedUser extends applyMixins(isolatedDb, 'users', 'id')() {
    
    static getIsolated2() {
      return this.isolated;
    }

    static getIsolated = () => {
      return this.isolated;
    }
  }

  beforeAll(async () => {
    await migrator.migrateToLatest();
  });

  beforeEach(async () => {
    const [IsolatedUser] = isolate([NonIsolatedUser]);
    await IsolatedUser.deleteOneByFields({
      email: 'test@gmail.com',
    });
  });

  it('should have a correct isolated by default', async () => {
    expect(isolatedDb.isolated).toBe(true);
    expect(NonIsolatedUser.isolated).toBe(false);

    expect(NonIsolatedUser.getIsolated2()).toBe(false);
  });

  it('should throw when you try to use isolated db', async () => {
    await expect(async () => {
      await NonIsolatedUser.insert({
        email: 'test@gmail.com',
        name: 'Tester',
        password: 'myPassword',
      });
   }).rejects.toThrowError("Cannot use insertInto() in not isolated model. Call isolate({ Model }) first.");

    await expect(async () => {
       await NonIsolatedUser.getById(1);
    }).rejects.toThrowError("Cannot use selectFrom() in not isolated model. Call isolate({ Model }) first.");
  });

  it('should be able to isolate model', async () => {
    const [IsolatedUser] = isolate([NonIsolatedUser]);

    expect(IsolatedUser.isolated).toBe(true);

    expect(IsolatedUser.getIsolated2()).toBe(true);
    expect(NonIsolatedUser.getIsolated2()).toBe(false);

    // isolated model should work
    const user = await IsolatedUser.insert({
      email: 'test@gmail.com',
      name: 'Tester',
      username: 'tester',
      password: 'myPassword',

    });

    await IsolatedUser.getById(user.id);

    // non isolated model should still throw
    await expect(async () => {
      await NonIsolatedUser.getById(1);
    }).rejects.toThrowError("Cannot use selectFrom() in not isolated model. Call isolate({ Model }) first.");
  });

  it('should be able to isolate model as object', async () => {
    const { NonIsolatedUser: IsolatedUser} = isolate({ NonIsolatedUser });

    // isolated model should work
    const user = await IsolatedUser.insert({
      email: 'test@gmail.com',
      name: 'Tester',
      username: 'tester',
      password: 'myPassword',
    });

    await IsolatedUser.getById(user.id);

    // non isolated model should still throw
    await expect(async () => {
      await NonIsolatedUser.getById(1);
    }).rejects.toThrowError("Cannot use selectFrom() in not isolated model. Call isolate({ Model }) first.");
  });

  it('should allow extend and copy isolated value', async () => {
    const [IsolatedUser] = isolate([NonIsolatedUser]);
    class DoubleIsolated extends IsolatedUser {}

    // isolated model should work
    const user = await DoubleIsolated.insert({
      email: 'test@gmail.com',
      name: 'Tester',
      username: 'tester',
      password: 'myPassword',
    });

    await DoubleIsolated.getById(user.id);

    // non isolated model should still throw
    await expect(async () => {
      await NonIsolatedUser.getById(1);
    }).rejects.toThrowError("Cannot use selectFrom() in not isolated model. Call isolate({ Model }) first.");


    DoubleIsolated.isolated = false;
    await expect(async () => {
      await DoubleIsolated.getById(1);
    }).rejects.toThrowError("Cannot use selectFrom() in not isolated model. Call isolate({ Model }) first.");

    // isolated model should work
    await IsolatedUser.getById(user.id);
  });
});

describe('transactions', () => {
  beforeAll(async () => {
    await migrator.migrateToLatest();

    await User.deleteOneByFields({
      email: 'test@gmail.com',
    });

    await User.deleteOneByFields({
      email: 'test-upsert@gmail.com',
    });

    await User.deleteOneByFields({
      email: 'test-insert-only@gmail.com',
    });
  });

  it('should able to increment column', async () => {
    const user = await User.insert({
      email: 'test@gmail.com',
      name: 'Tester',
      password: 'myPassword',
    });

    expect(user.followersCount).toBe(0);

    const updatedUser = await User.getByIdAndIncrement(user.id, {
      followersCount: 3,
    });

    expect(updatedUser.followersCount).toBe(3);
  });

  it('should able to decrement column', async () => {
    const user = await User.getByEmail('test@gmail.com');
    expect(user.followersCount).toBe(3);

    const updatedUser = await User.getByIdAndIncrement(user.id, {
      followersCount: -1,
    });

    expect(updatedUser.followersCount).toBe(2);
  });

  it('should able to upsert', async () => {
    const user = await User.upsert({
      email: 'test-upsert@gmail.com',
      name: 'Tester Before Upsert',
      password: 'myPassword',
    }, {
      name: 'Tester after Upsert',
    }, ['email']);

    expect(user.name).toBe('Tester Before Upsert');


    const updatedUser = await User.upsert({
      email: 'test-upsert@gmail.com',
      name: 'Tester Before Upsert',
      password: 'myPassword',
    }, {
      name: 'Tester After Upsert',
    }, ['email']);

    expect(updatedUser.name).toBe('Tester After Upsert');
  });

  it('should able to insertIfNotExists', async () => {
    const user = await User.insertIfNotExists({
      email: 'test-insert-only@gmail.com',
      name: 'Tester Before Insert Only',
      password: 'myPassword',
    }, 'email', 'email');

    expect(user.name).toBe('Tester Before Insert Only');
    expect(user.email).toBe('test-insert-only@gmail.com');

    const updatedUser = await User.insertIfNotExists({
      email: 'test-insert-only@gmail.com',
      name: 'Tester After Insert Only',
      password: 'myPassword',
    }, 'email', 'email');

    expect(updatedUser.name).toBe('Tester Before Insert Only');
    expect(updatedUser.email).toBe('test-insert-only@gmail.com');
  });

  it('should execute transaction via db', async () => {
    expect(db.isTransaction).toBe(false);

    // everything inside it should be executed outside of transaction
    const dbPromise = new Promise<Database<DB>>((resolve) => {
      expect(db.isTransaction).toBe(false);
      setTimeout(() =>{
        expect(db.isTransaction).toBe(false);
        resolve(db);
      }, 1000);
    });

    async function wait(db: Database<DB>) {
      return new Promise((resolve) => {
        expect(db.isTransaction).toBe(true);
        setTimeout(() =>{
          expect(db.isTransaction).toBe(true);
          resolve(1);
        }, 1000);
      })
    }

    await db.transaction(async () => {
      expect(db.isTransaction).toBe(true);

      await wait(db);

      expect(db.isTransaction).toBe(true);
      const user = await User.findByEmail('test@gmail.com');
      expect(user).toBeDefined();

      const dbFromPromise = await dbPromise;
      expect(dbFromPromise.isTransaction).toBe(true); 
    });

    expect(db.isTransaction).toBe(false);
  });

  it('should execute related query', async () => {
    const user = await User.getByEmail('test@gmail.com');

    const comment = await Comment.insert({
      userId: user.id,
      message: 'Test message',
    });

    const comments2 = await User
      .relatedQuery(User.relations.comments, user.id)
      .execute();

    expect(comments2.length).toBe(1);
    expect(comments2[0].message).toBe(comment.message);
  });

  it('should execute find related query', async () => {
    const user = await User.getByEmail('test@gmail.com');

    const comment = await Comment.insert({
      userId: user.id,
      message: 'Test message 2',
    });

    const comments = await User.findRelated(User.relations.comments, [user]);

    expect(comments.length).toBe(2);
    expect(comments[0].message).toBe('Test message');
    expect(comments[1].message).toBe('Test message 2');
  });

  it('should execute find related and combine query', async () => {
    const user = await User.getByEmail('test@gmail.com');

    const [updatedUser] = await User.findRelatedAndCombine(User.relations.comments, [user], 'comments');

    expect(updatedUser.comments.length).toBe(2);
    expect(updatedUser.comments[0].message).toBe('Test message');
    expect(updatedUser.comments[1].message).toBe('Test message 2');
  });

  it('should execute find related and combine query with correct number of comments and users', async () => {
    const user = await User.getByEmail('test@gmail.com');
    const user2 = await User.getByEmail('test-insert-only@gmail.com');

    const comment3 = await Comment.insert({
      userId: user2.id,
      message: 'Test message 3',
    });

    const [updatedUser1, updatedUser2] = await User.findRelatedAndCombine(User.relations.comments, [user, user2], 'comments');

    expect(updatedUser1.comments.length).toBe(2);
    expect(updatedUser1.comments[0].message).toBe('Test message');
    expect(updatedUser1.comments[1].message).toBe('Test message 2');

    expect(updatedUser2.comments.length).toBe(1);
    expect(updatedUser2.comments[0].message).toBe(comment3.message);
  });

  it('should execute get related by id query', async () => {
    const user = await User.getByEmail('test@gmail.com');
 
    const comments = await User.getRelatedById(User.relations.comments, user.id);

    expect(comments.length).toBe(2);
    expect(comments[0].message).toBe('Test message');
    expect(comments[1].message).toBe('Test message 2');
  });

  it('should not call afterCommit', async () => {
    let test;

    await expect(async () => {
      await User.transaction(async ({ afterCommit }) => {

        afterCommit(async () => {
          test = 'after commit success';
          throw new Error('Should not be called');
        });

        throw new Error('Transaction rejected');
      })
    }).rejects.toThrowError("Transaction rejected");

    expect(test).toBeUndefined();
  });

  it('should call afterCommit', async () => {
    let test;
    
    await User.transaction(async ({ afterCommit }) => {
      afterCommit(async () => {
        test = 'after commit success';
      });
    });

    expect(test).toBe('after commit success');
  });
/*
  it('should execute transaction via model', async () => {
    await User.transaction(async () => {
      const user = await User.findByEmail('zfedor@gmail.com');
      console.log('user 1', user);
    });

    const user = await User.findByEmail('liviatlumacova@gmail.com');
    console.log('user 2', user);
  });

  it('should execute two transactions in parallel', async () => {
    const [user1, user2] = await Promise.all([
      User.transaction(() => User.findByEmail('zfedor@gmail.com')),
      User.transaction(() => User.findByEmail('liviatlumacova@gmail.com')),
    ]);

    console.log('user 1', user1);
    console.log('user 2', user2);
  });

  it('should execute two transactions in parallel', async () => {
    const user1 = await User.getOneByFields({
      email: 'zfedor@gmail.com',
    }) as User;

    console.log('is instance', user1 instanceof User);

    user1.email;

    expect(user1).toBeDefined();
    expect(user1.email).toBe('zfedor@gmail.com');
  });
  */
});


describe('cursors', () => {
  it('should execute cursorable quest', async () => {
    const user = await User.getByEmail('test@gmail.com');
/*
    const comment = await Comment.insert({
      userId: user.id,
      message: 'Test message',
    });

          [SortKey.CREATED_AT]: [
        ['createdAt', { direction: 'ASC', reversible: true, timestamp: true }], 
        ['updatedAt', { direction: 'ASC', reversible: true, timestamp: true }],
        ['id', { direction: 'DESC', reversible: true }]
      ],
    */

    const data = await Comment.getCursorableConnection({
      sortKey: SortKey.CREATED_AT,
      after: 'WyIyMDIzLTA0LTIyIDIwOjEwOjU0IiwiMjAyMy0wNC0yMiAyMDoxMDo1NCIsNTNd', 
    });

    console.log(data.edges);
  });
});
