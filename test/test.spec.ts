import { Generated } from 'kysely';
import { Database, RelationType, NoResultError, applyMixins, updatedAt, globalId, isolate, Model, slug, cursorable } from '../src';

if (!process.env.DATASABE_URL) {
  throw new Error('DATASABE_URL environment variable is not set');
}

interface Users {
  id: Generated<number>;
  email: string;
  name: string;
  password: string;
  createdAt: Generated<number>;
  username: Generated<string>;
  updatedAt: Generated<string>;
  followersCount: Generated<number>;
}

interface Comments {
  id: number;
  updatedAt: string;
  userId: number;
}

interface DB {
  users: Users;
  users2: {
    id: number;
    bla: string;
    test2: number;
  };
  comments: Comments;
};

const db = new Database<DB>({
  connectionString: process.env.DATASABE_URL,
  debug: true,
});


//class User extends SlugClass {
/*
class User extends slug(globalId(updatedAt(Model2, 'updatedAt')), {
  field: 'email',
  sources: ['updatedAt', 'email'],
  slugOptions: {
    truncate: 15,
    custom: {
      quizana: '',
      admin: '',
    },
  },
}) {
*/

enum SortKey {
  CREATED_AT = 'CREATED_AT',
  FOLLOWERS_COUNT = 'FOLLOWERS_COUNT',
}

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


async function wait(db: Database<DB>) {
  return new Promise((resolve) => {
    console.log('isTransaction inside wait', db.isTransaction);
    setTimeout(() =>{
      console.log('isTransaction inside wait setTimeout callback', db.isTransaction);
      resolve(1);
    }, 1000);
  })
}

const dbPromise = new Promise<Database<DB>>((resolve) => {
  console.log('isTransaction inside promise', db.isTransaction);
  setTimeout(() =>{
    console.log('isTransaction inside promise setTimeout callback', db.isTransaction);
    resolve(db);
  }, 1000);
})

*/

describe('transactions', () => {
  it('should execute transaction via db', async () => {

    const connection = await User.getLazyCursorableConnection({
      first: 3,
      sortKey: SortKey.FOLLOWERS_COUNT,
    });
    
    const edges = await connection.edges();
    console.log('edges without after', edges);

    const { createdAt } = edges[0].node;

    // @ts-ignore
    console.log('createdAt', createdAt, typeof createdAt, createdAt.toISOString());

    const connection2 = await User.getLazyCursorableConnection({
      first: 3,
      after: 'Wzk4MSwiMjAxOC0wNS0yNVQxODozMjowMC40MTlaIiw4OTk2NjVd',
      sortKey: SortKey.FOLLOWERS_COUNT,
    });

    console.log('edges after fter', await connection2.edges());

    const totalCount = await connection.totalCount();

    console.log('totalCount', totalCount);


    const connection3 = await User.getLazyCursorableConnection({
      last: 3,
      sortKey: SortKey.FOLLOWERS_COUNT,
    });
    
    const edges3 = await connection3.edges();
    console.log('edges with last', edges3);

    const connection4 = await User.getLazyCursorableConnection({
      last: 2,
      before: 'WzAsIjIwMTMtMDQtMjJUMDU6NTM6MzguMDAwWiIsMTEzMzEzXQ==',
      sortKey: SortKey.FOLLOWERS_COUNT,
    });
    
    const edges4 = await connection4.edges();
    console.log('edges with last and before', edges4);

    

    /*
    const newUser = await User.insert({
      email: 'zfedor+test890@gmail.com',
      name: 'Zlatko Fedor',
      password: 'test',
    
    })
    
    console.log('newUser', newUser);
    */
    /*
    console.log('isTransaction before transaction', db.isTransaction);
    await db.transaction(async () => {
      console.log('isTransaction before', db.isTransaction);
      await wait(db);
      console.log('isTransaction after wait', db.isTransaction);
      const user = await User.findByEmail('zfedor@gmail.com');
      console.log('user 1', user);

      const dbFromPromise = await dbPromise;
      console.log('isTransaction dbFromPromise after wait ', dbFromPromise.isTransaction);

      
    });

    console.log('isTransaction after transaction ', db.isTransaction);

    return;

    const row = await User.getOne('email', 'zfedor@gmail.com');
    console.log('row', row);
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

    const user = await User.findByEmail('liviatlumacova@gmail.com');
    console.log('user 2', user);

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
