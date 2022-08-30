
import { NoResultError } from 'kysely';
import Database from './Database';
import applyMixins from './utils/applyMixins';
import updatedAt from './mixins/updatedAt';
import RelationType from './constants/RelationType';

if (!process.env.DATASABE_URL) {
  throw new Error('DATASABE_URL environment variable is not set');
}

interface Users {
  id: number;
  email: string;
  updatedAt: string;
}

interface Comments {
  id: number;
  updatedAt: string;
  userId: number;
}

interface DB {
  users: Users;
  users2: {
    bla: string;
  };
  comments: Comments;
};

const db = new Database<DB>({
  connectionString: process.env.DATASABE_URL,
});

class User extends applyMixins(
  db, 'users', 'id',
  db.model('users', 'id', NoResultError),
  updatedAt<DB, 'users', 'id'>('updatedAt'),
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



const user = new User({
  email: 'test@gmail.com',
  id: 234,
  updatedAt: 'test',
  // additional: 234,
});


user.email;
user.item;
user.i;



describe('transactions', () => {
  it('should execute transaction via db', async () => {
    /*
    await db.transaction(async () => {
      const user = await User.findByEmail('zfedor@gmail.com');
      console.log('user 1', user);

      
    });
    */

    const row = await User.getOne('email', 'zfedor@gmail.com');
    console.log('row', row);
/*
    const comments = await User.relatedQuery([row], User.relations.comments).limit(2).execute();
    console.log('last two comments', comments);

    
*/


    const updatedRows = await User.findRelatedAndCombine([row], User.relations.comments2, 'comments2');
    console.log('last two comments', updatedRows);

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
