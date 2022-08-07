import Model from './Model';
import Database from './Database';
import applyPlugins from './plugins/applyPlugins';

if (!process.env.DATASABE_URL) {
  throw new Error('DATASABE_URL environment variable is not set');
}

interface Users {
  id: string;
  email: string;
}

interface DB {
  users: Users;
  users2: Users;
};

const db = new Database<DB>({
  connectionString: process.env.DATASABE_URL,
});

export default class UserModel extends applyPlugins<DB, 'users', 'id'>(Model, 'users', 'id', [
]) {
  static bind<DB>(db: Database<DB>) {
    return new UserModel(db, 'users', 'id');
  }

  findByEmail(email: string) {
    return this.findOne('email', email);
  }
}
/*

class UserModel extends Model<DB, 'users', 'id'> {
  findByEmail(email: string) {
    return this.findOne('email', email);
  }
}
*/


/*
class UserModel extends Model<DB, 'users', 'id'> {
  static bind(db: Database<DB>) {
    return super.bind(db, this, 'users', 'id')
  }

  findByEmail(email: string) {
    return this.findOne('email', email);
  }
}


/*
const User = UserModel.bind(db);

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

*/