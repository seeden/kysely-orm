import { SqliteDialect, Migrator, FileMigrationProvider } from 'kysely';
import SQLLiteDatabase from 'better-sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
import { Database, RelationType, applyMixins, updatedAt, globalId, slug, cursorable } from '../src';
import DB, { Users } from './fixtures/DB';

const dialect = new SqliteDialect({
  database: new SQLLiteDatabase('db.test'),
});

const db = new Database<DB>({
  dialect,
  // debug: true,
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

class Quiz extends applyMixins(db, 'quizzes', 'id')(
  (base) => updatedAt<DB, 'quizzes', 'id', typeof base>(base, 'updatedAt'),
  (base) => globalId<DB, 'quizzes', 'id', typeof base>(base, Number),
  (base) => cursorable<DB, 'quizzes', 'id', typeof base>(base, {
    sortKeys: {
      [SortKey.CREATED_AT]: [
        ['createdAt', 'ASC', true], 
        ['id', 'ASC']
      ],
    },
    max: 100,
    limit: 10,
  }),
) {
}

/*
const quiz = await Quiz.getById(1);
quiz.id;
//quiz.sss;
quiz.reactionStatistics;
*/


class User extends applyMixins(db, 'users', 'id')(
  (base) => updatedAt<DB, 'users', 'id', typeof base>(base, 'updatedAt'),
  (base) => globalId<DB, 'users', 'id', typeof base>(base, Number),
  (base) => cursorable<DB, 'users', 'id', typeof base>(base, {
    sortKeys: {
      [SortKey.CREATED_AT]: [
        ['createdAt', 'ASC', true], 
        ['id', 'ASC']
      ],
      [SortKey.FOLLOWERS_COUNT]: [
        ['followersCount', 'DESC', true], 
        ['createdAt', 'ASC'],
        ['id', 'ASC'],
      ],
    },
    max: 100,
    limit: 10,
  }),
  (base) => slug<DB, 'users', 'id', typeof base>(base, {
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
    comments: this.relation(RelationType.HasOneRelation, 'users.id', 'comments.userId'),
    comments2: this.relation(RelationType.HasManyRelation, 'users.id', 'comments.userId'),
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

  get item() {
    return 1;
  }

  get i() {
    return 'ddd';
  }
}

/*
const models = {
  User,
  User2: User,
};

const isolatedModels = isolate(models);
isolatedModels.User.testttt();
models.User.testttt();

const result4 = await User.getById(1);

const testData = await User.findOne('id', 1);

const fields = {
  id: 1,
  test: 2,
  email: 'sss',
  updatedAt: '2020-01-01',
};
const testData2 = await User.findByFields(fields);

fields.test = 1;

const result = await isolatedModels.User.getById(1);
console.log('result', result);
isolatedModels.User.findByEmail('ssss');
isolatedModels.User.findByEmail(12);
isolatedModels.User.findByEmail('12');
isolatedModels.User.findByGlobalId(12);
isolatedModels.User.findByGlobalId('3333');

const userGlobalId = isolatedModels.User.getGlobalId(result4);
console.log(userGlobalId);

const user2 = await User.getById('dddd');
User.findByEmail(12);
User.findByEmail('12');
User.findByGlobalId(12);
User.findByGlobalId('3333');

const item = await User.findBySlug('ffff');
user2.updatedAt;
user2.updatedAt2;

isolatedModels.User.getLocalId(12);
isolatedModels.User.getLocalId('12');

*/


/*
class User extends applyMixins(
  db, 'users', 'id',
  db.model('users', 'id', NoResultError),
  updatedAt<DB, 'users', 'id'>('updatedAt'),
  globalId<DB, 'users', 'id'>(),
 ) {
  static relations = {
    comments: this.relation(RelationType.HasOneRelation, 'users.id', 'comments.userId'),
    comments2: this.relation(RelationType.HasManyRelation, 'users.id', 'comments.userId'),
  };

  static findByEmail(email: string) {
    return this.findOne('email', email);
  }

  static updateByEmail(email: string, data: Partial<Users>) {
    return this.updateTable().where('email', '=', email).set(data).execute();
  }

  static testttt() {
    return this.db.selectFrom('users').innerJoin('comments', 'users.id', 'comments.userId').execute();

  }

  get item() {
    return 1;
  }

  get i() {
    return 'ddd';
  }
}
*/

/*
const user = new User({
  email: 'test@gmail.com',
  id: 234,
  updatedAt: 'test',
  // additional: 234,
});



user.email;
user.item;
user.i;


*/

describe('transactions', () => {
  beforeAll(async () => {
    await migrator.migrateToLatest();

    await User.deleteOneByFields({
      email: 'test@gmail.com',
    });
  });

  it('should able to increment column', async () => {
    const user = await User.insert({
      email: 'test@gmail.com',
      name: 'Tester',
      password: 'myPassword',
    });

    expect(user.followersCount).toBe(0);

    const updatedUser = await User.findByIdAndIncrement(user.id, {
      followersCount: 3,
    });

    expect(updatedUser.followersCount).toBe(3);
  });

  it('should able to decrement column', async () => {
    const user = await User.getByEmail('test@gmail.com');
    expect(user.followersCount).toBe(3);

    const updatedUser = await User.findByIdAndIncrement(user.id, {
      followersCount: -1,
    });

    expect(updatedUser.followersCount).toBe(2);
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

/*
    const comments = await User.relatedQuery([row], User.relations.comments).limit(2).execute();
    console.log('last two comments', comments);

    
*/
/*

    const updatedRows = await User.findRelatedAndCombine([row], User.relations.comments2, 'comments2');
    console.log('last two comments', updatedRows);
*
    /*
    comments[0].userId;
    comments[0].id;

    const comments2 = await User
      .relatedQuery([row], User.relations.comments)
      .where('users.id', '=', 7)
      .execute();

    */

    //const user = await User.findByEmail('liviatlumacova@gmail.com');
    //console.log('user 2', user);

    //await User.fetchGraph([user], ['comments']);
    // console.log('user with comments', user);
/*
    const [firstUser] = await User.findRelated([user], 'comments');
    console.log('users comments', firstUser);
    
    firstUser.comments;
    */
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

  

  it('should not call afterCommit', async () => {
    await User.transaction(async ({ afterCommit }) => {
      throw new Error('Transaction rejected');

      console.log('user 1', user);
    });

    const user = await User.findByEmail('liviatlumacova@gmail.com');
    console.log('user 2', user);
  });
  */
});
