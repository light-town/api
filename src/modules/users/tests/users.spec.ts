import { getRepositoryToken } from '@nestjs/typeorm';
import * as faker from 'faker';
import UserEntity from '~/db/entities/user.entity';
import { UsersService } from '../users.service';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import createTestingModule from './helpers/createTestingModule';

describe('[Users Module] ...', () => {
  let usersService: UsersService;
  let usersRepository: Repository<UserEntity>;

  beforeAll(async () => {
    const moduleFixture = await createTestingModule();

    usersService = moduleFixture.get<UsersService>(UsersService);
    usersRepository = moduleFixture.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity)
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should create a user', async () => {
    const TEST_USER_ENTITY: UserEntity = {
      id: faker.random.uuid(),
      name: faker.internet.userName(),
      avatarUrl: faker.internet.avatar(),
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    jest
      .spyOn(usersRepository.manager, 'save')
      .mockResolvedValueOnce(TEST_USER_ENTITY);

    const user: UserEntity = await usersService.create({
      name: TEST_USER_ENTITY.name,
      avatarUrl: TEST_USER_ENTITY.avatarUrl,
    });

    expect(user).toStrictEqual(TEST_USER_ENTITY);
  });

  it('should throw error when username is invalid', () => {
    const TEST_USER_ENTITY: UserEntity = {
      id: faker.random.uuid(),
      name: faker.internet.userName(),
      avatarUrl: faker.internet.avatar(),
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    expect(
      usersService.create({
        name: null,
        avatarUrl: TEST_USER_ENTITY.avatarUrl,
      })
    ).rejects.toEqual(new Error(`The user name must be 'string' type`));
  });

  it('should find users', async () => {
    const TEST_FIND_OPTIONS: FindManyOptions<UserEntity> = {
      where: {
        id: faker.random.uuid(),
      },
    };

    const TEST_USERS_ENTITY: UserEntity[] = [
      {
        id: faker.random.uuid(),
        name: faker.internet.userName(),
        avatarUrl: faker.internet.avatar(),
        updatedAt: new Date(),
        createdAt: new Date(),
        isDeleted: false,
      },
    ];

    const mockFindFunc = jest
      .spyOn(usersRepository.manager, 'find')
      .mockResolvedValueOnce(TEST_USERS_ENTITY);

    expect(await usersService.find(TEST_FIND_OPTIONS)).toStrictEqual(
      TEST_USERS_ENTITY
    );

    expect(mockFindFunc).toBeCalledTimes(1);
    expect(mockFindFunc).toBeCalledWith(UserEntity, TEST_FIND_OPTIONS);
  });

  it('should find one user', async () => {
    const TEST_FIND_OPTIONS: FindOneOptions<UserEntity> = {
      select: ['id'],
      where: {
        id: faker.random.uuid(),
      },
    };

    const TEST_USER_ENTITY: UserEntity = {
      id: faker.random.uuid(),
      name: faker.internet.userName(),
      avatarUrl: faker.internet.avatar(),
      updatedAt: new Date(),
      createdAt: new Date(),
      isDeleted: false,
    };

    const mockFindOneFunc = jest
      .spyOn(usersRepository.manager, 'findOne')
      .mockResolvedValueOnce(TEST_USER_ENTITY);

    expect(await usersService.findOne(TEST_FIND_OPTIONS)).toStrictEqual(
      TEST_USER_ENTITY
    );

    expect(mockFindOneFunc).toBeCalledTimes(1);
    expect(mockFindOneFunc).toBeCalledWith(UserEntity, TEST_FIND_OPTIONS);
  });
});
