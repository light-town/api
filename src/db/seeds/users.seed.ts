import * as faker from 'faker';
import User from '~/db/entities/user.entity';
import Factory from './factory';
import Seeder from './seeder';

export class UsersFactory implements Factory<User> {
  public create({ name, avatarUrl }: Partial<User> = {}) {
    const user = new User();
    user.name = name || `${faker.name.lastName()} ${faker.name.firstName()}`;
    user.avatarUrl = avatarUrl || faker.internet.avatar();
    return user;
  }
}

export class UsersSeeder extends Seeder<User>(User) {
  public constructor(factory: UsersFactory) {
    super(factory);
  }
}

export default UsersSeeder;
