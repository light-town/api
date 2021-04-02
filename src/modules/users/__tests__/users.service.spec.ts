import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as faker from 'faker';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import UserEntity from '~/db/entities/user.entity';
import UsersService from '../users.service';
import createTestingModule from './helpers/createTestingModule';

describe('[Users Module] ...', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let usersRepository: Repository<UserEntity>;

  beforeAll(async () => {
    const app = await createTestingModule();

    usersService = app.get<UsersService>(UsersService);
    usersRepository = app.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a user', async () => {
    const TEST_USER_ENTITY: UserEntity = {
      id: faker.datatype.uuid(),
      name: faker.internet.userName(),
      avatarUrl: faker.internet.avatar(),
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    jest.spyOn(usersRepository, 'save').mockResolvedValueOnce(TEST_USER_ENTITY);
    jest
      .spyOn(usersRepository, 'create')
      .mockReturnValueOnce(<any>TEST_USER_ENTITY);

    const user: UserEntity = await usersService.create({
      name: TEST_USER_ENTITY.name,
      avatarUrl: TEST_USER_ENTITY.avatarUrl,
    });

    expect(user).toStrictEqual(TEST_USER_ENTITY);

    expect(jest.spyOn(usersRepository, 'create')).toHaveBeenCalledTimes(1);
    expect(jest.spyOn(usersRepository, 'create')).toHaveBeenCalledWith({
      name: TEST_USER_ENTITY.name,
      avatarUrl: TEST_USER_ENTITY.avatarUrl,
    });

    expect(jest.spyOn(usersRepository, 'save')).toHaveBeenCalledTimes(1);
    expect(jest.spyOn(usersRepository, 'save')).toHaveBeenCalledWith(
      TEST_USER_ENTITY
    );
  });

  it('should throw error when username is invalid', async () => {
    const TEST_USER_ENTITY: UserEntity = {
      id: faker.datatype.uuid(),
      name: faker.internet.userName(),
      avatarUrl: faker.internet.avatar(),
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    try {
      await usersService.create({
        name: null,
        avatarUrl: TEST_USER_ENTITY.avatarUrl,
      });
    } catch (e) {
      expect(e).toStrictEqual(new Error(`The user name must be 'string' type`));
    }
  });

  it('should find users', async () => {
    const TEST_FIND_OPTIONS: FindManyOptions<UserEntity> = {
      where: {
        id: faker.datatype.uuid(),
      },
    };

    const TEST_USERS_ENTITY: UserEntity[] = [
      {
        id: faker.datatype.uuid(),
        name: faker.internet.userName(),
        avatarUrl: faker.internet.avatar(),
        updatedAt: new Date(),
        createdAt: new Date(),
        isDeleted: false,
      },
    ];

    const mockFindFunc = jest
      .spyOn(usersRepository, 'find')
      .mockResolvedValueOnce(TEST_USERS_ENTITY);

    expect(await usersService.find(TEST_FIND_OPTIONS)).toStrictEqual(
      TEST_USERS_ENTITY
    );

    expect(mockFindFunc).toBeCalledTimes(1);
    expect(mockFindFunc).toBeCalledWith(TEST_FIND_OPTIONS);
  });

  it('should find one user', async () => {
    const TEST_FIND_OPTIONS: FindOneOptions<UserEntity> = {
      select: ['id'],
      where: {
        id: faker.datatype.uuid(),
      },
    };

    const TEST_USER_ENTITY: UserEntity = {
      id: faker.datatype.uuid(),
      name: faker.internet.userName(),
      avatarUrl: faker.internet.avatar(),
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    const mockFindOneFunc = jest
      .spyOn(usersRepository, 'findOne')
      .mockResolvedValueOnce(TEST_USER_ENTITY);

    expect(await usersService.findOne(TEST_FIND_OPTIONS)).toStrictEqual(
      TEST_USER_ENTITY
    );

    expect(mockFindOneFunc).toBeCalledTimes(1);
    expect(mockFindOneFunc).toBeCalledWith(TEST_FIND_OPTIONS);
  });
});
