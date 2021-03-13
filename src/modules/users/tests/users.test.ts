import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as faker from 'faker';
import UserEntity from '~/db/entities/user.entity';
import { UsersModule } from '../users.module';
import { UsersService } from '../users.service';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';

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
          find: () => {},
          findOne: () => {},
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

    jest.spyOn(usersRepository, 'save').mockResolvedValueOnce(TEST_USER_ENTITY);

    const user: UserEntity = await usersService.create(TEST_USER_ENTITY.name, {
      avatarURL: TEST_USER_ENTITY.avatarURL,
    });

    expect(user).toStrictEqual(TEST_USER_ENTITY);
  });

  it('should throw error when username is invalid', () => {
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

  it('should find users', () => {
    const TEST_FIND_OPTIONS: FindManyOptions<UserEntity> = {
      where: {
        id: faker.random.uuid(),
      },
    };

    const TEST_USERS_ENTITY: UserEntity[] = [
      {
        id: faker.random.uuid(),
        name: faker.internet.userName(),
        avatarURL: faker.internet.avatar(),
        updatedAt: new Date(),
        createdAt: new Date(),
        isDeleted: false,
      },
    ];

    const mockFindFunc = jest
      .spyOn(usersRepository, 'find')
      .mockResolvedValueOnce(TEST_USERS_ENTITY);

    expect(usersService.find(TEST_FIND_OPTIONS)).resolves.toStrictEqual(
      TEST_USERS_ENTITY
    );

    expect(mockFindFunc.mock.calls.length).toEqual(1);
    expect(mockFindFunc.mock.calls[0][0]).toStrictEqual(TEST_FIND_OPTIONS);
  });

  it('should find one user', () => {
    const TEST_FIND_OPTIONS: FindOneOptions<UserEntity> = {
      where: {
        id: faker.random.uuid(),
      },
    };

    const TEST_USER_ENTITY: UserEntity = {
      id: faker.random.uuid(),
      name: faker.internet.userName(),
      avatarURL: faker.internet.avatar(),
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    const mockFindOneFunc = jest
      .spyOn(usersRepository, 'findOne')
      .mockResolvedValueOnce(TEST_USER_ENTITY);

    expect(usersService.findOne(TEST_FIND_OPTIONS)).resolves.toStrictEqual(
      TEST_USER_ENTITY
    );

    expect(mockFindOneFunc.mock.calls.length).toEqual(1);
    expect(mockFindOneFunc.mock.calls[0][0]).toStrictEqual(TEST_FIND_OPTIONS);
  });
});