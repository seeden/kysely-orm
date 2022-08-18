import Database from './Database';
import applyMixins from './utils/applyMixins';
import updatedAt from './mixins/updatedAt';

if (!process.env.DATASABE_URL) {
  throw new Error('DATASABE_URL environment variable is not set');
}

interface Users {
  id: number;
  email: string;
  updatedAt: string;
}

interface DB {
  users: Users;
  users2: {
    bla: string;
  };
};

const db = new Database<DB>({
  connectionString: process.env.DATASABE_URL,
});

class Test2 implements Users {
  id!: number;
  email!: string;
  updatedAt!: string;

  constructor(data: Users) {
    Object.assign(this, data);
  }
}

const test = new Test2({
  id: 1,
  email: 'dddd',
  updatedAt: '',

});
//test.idddd;
test.email;
// test.ooo;



class User extends applyMixins(
  db, 'users', 'id',
  db.model('users', 'id'),
  updatedAt<DB, 'users', 'id'>('updatedAt'),
 ) {
  static findByEmail(email: string) {
    return this.findOne('email', email);
  }

  static updateByEmail(email: string, data: Partial<Users>) {
    return this.updateTable().where('email', '=', email).set(data).execute();
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
//user.ttttt;


describe('transactions', () => {
  it('should execute transaction via db', async () => {
    await db.transaction(async () => {
      const user = await User.findByEmail('zfedor@gmail.com');
      console.log('user 1', user);
    });

    const user = await User.findByEmail('liviatlumacova@gmail.com');
    console.log('user 2', user);
  });

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
/*
    expect(user1).toBeDefined();
    expect(user1.email).toBe('zfedor@gmail.com');
    */
  });

  

  it('should not call afterCommit', async () => {
    await User.transaction(async ({ afterCommit }) => {
      throw new Error('Transaction rejected');

      console.log('user 1', user);
    });

    const user = await User.findByEmail('liviatlumacova@gmail.com');
    console.log('user 2', user);
  });
});
