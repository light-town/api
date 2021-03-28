import { INestApplication } from '@nestjs/common';
import * as faker from 'faker';
import { MFATypesEnum } from '~/modules/auth/auth.dto';
import UsersService from '~/modules/users/users.service';
import AccountsService from '../accounts.service';
import Api from './helpers/api';
import createTestingModule from './helpers/createTestingModule';

describe('[Accounts Module] [Controller] ...', () => {
  let app: INestApplication;
  let api: Api;
  let accountsService: AccountsService;
  let usersService: UsersService;

  beforeAll(async () => {
    app = await createTestingModule();
    api = new Api(app);

    accountsService = app.get<AccountsService>(AccountsService);
    usersService = app.get<UsersService>(UsersService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return account', async () => {
    const TEST_USER = {
      id: faker.random.uuid(),
      name: faker.random.word(),
      avatarUrl: null,
    };
    const TEST_ACCOUNT = {
      id: faker.random.uuid(),
      userId: TEST_USER.id,
      mfaType: {
        name: MFATypesEnum.NONE,
      },
    };
    const TEST_ACCOUNT_KEY = faker.random.word();

    jest
      .spyOn(accountsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_ACCOUNT);

    jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(<any>TEST_USER);

    const response = await api.getAccount(TEST_ACCOUNT_KEY);

    expect(response.status).toEqual(200);
    expect(response.body).toStrictEqual({
      data: {
        accountUuid: TEST_ACCOUNT.id,
        accountName: TEST_USER.name,
        accountAvatarUrl: TEST_USER.avatarUrl,
        userUuid: TEST_USER.id,
        userName: TEST_USER.name,
        userAvatarUrl: TEST_USER.avatarUrl,
        MFAType: TEST_ACCOUNT.mfaType.name,
      },
      statusCode: 200,
    });
  });

  it('should throw error while getting account when account key is not correct', async () => {
    const TEST_ACCOUNT_KEY = faker.random.word();

    jest.spyOn(accountsService, 'findOne').mockResolvedValueOnce(undefined);

    const response = await api.getAccount(TEST_ACCOUNT_KEY);

    expect(response.status).toEqual(404);
    expect(response.body).toStrictEqual({
      error: {
        type: 'Not Found',
        message: 'The account was not found',
      },
      statusCode: 404,
    });
  });

  it('should throw error while getting account when acoount user was not found', async () => {
    const TEST_ACCOUNT = {
      id: faker.random.uuid(),
      mfaType: {
        name: MFATypesEnum.NONE,
      },
    };
    const TEST_ACCOUNT_KEY = faker.random.word();

    jest
      .spyOn(accountsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_ACCOUNT);

    jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(undefined);

    const response = await api.getAccount(TEST_ACCOUNT_KEY);

    expect(response.status).toEqual(500);
    expect(response.body).toStrictEqual({
      error: {
        type: 'Internal Server Error',
        message: 'The account user was not found',
      },
      statusCode: 500,
    });
  });
});
