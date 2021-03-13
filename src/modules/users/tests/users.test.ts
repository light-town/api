import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import * as faker from 'faker';
import UserEntity from '~/db/entities/user.entity';
import { UsersModule } from '../users.module';
import { UsersService } from '../users.service';
import { Repository } from 'typeorm';

dotenv.config();

jest.setTimeout(5000);

describe('[Auth Module] ...', () => {
  let usersService: UsersService;
  let usersRepository: Repository<UserEntity>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [UsersModule],
    })
      .overrideProvider(getRepositoryToken(UserEntity))
      .useFactory({
        factory: jest.fn(() => ({
          create: () => {},
          save: () => {},
        })),
      })
      .compile();

    usersService = moduleFixture.get<UsersService>(UsersService);
    usersRepository = moduleFixture.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity)
    );
  });

  it('should create a user', async () => {
    const TEST_USER_ENTITY: UserEntity = {
      id: faker.random.uuid(),
      name: faker.internet.userName(),
      avatarURL: faker.internet.avatar(),
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    jest
      .spyOn(usersRepository, 'save')
      .mockReturnValueOnce(Promise.resolve(TEST_USER_ENTITY));

    const user: UserEntity = await usersService.create(TEST_USER_ENTITY.name, {
      avatarURL: TEST_USER_ENTITY.avatarURL,
    });

    expect(user).toStrictEqual(TEST_USER_ENTITY);
  });

  it('should throw error when username is invalid', async () => {
    const TEST_USER_ENTITY: UserEntity = {
      id: faker.random.uuid(),
      name: faker.internet.userName(),
      avatarURL: faker.internet.avatar(),
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    expect(
      usersService.create(null, {
        avatarURL: TEST_USER_ENTITY.avatarURL,
      })
    ).rejects.toEqual(new Error(`The user name must be 'string' type`));
  });
});
