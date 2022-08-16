import Database from './Database';
import applyMixins from './utils/applyMixins';
import slug from './mixins/slug';
import updatedAt from './mixins/updatedAt';
import assign from './mixins/assign';
import { type Model } from './mixins/model';
import globalId from './mixins/globalId';
import Constructor from './@types/Constructor';

if (!process.env.DATASABE_URL) {
  throw new Error('DATASABE_URL environment variable is not set');
}

interface Users {
  id: number;
  email: string;
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

class User extends db.model('users', 'id') {
  static findByEmail(email: string) {
    return this.findOne('email', email);
  }
}


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

  it('should not call afterCommit', async () => {
    await User.transaction(async ({ afterCommit }) => {
      throw new Error('Transaction rejected');

      console.log('user 1', user);
    });

    const user = await User.findByEmail('liviatlumacova@gmail.com');
    console.log('user 2', user);
  });
});
