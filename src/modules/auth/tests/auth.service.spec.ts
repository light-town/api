import { AuthService } from '../auth.service';
import { createTestingModule } from './helpers/createTestingModule';
import { srp, common } from '@light-town/core';
import { SignInDTO, SignUpDTO } from '../auth.dto';
import * as faker from 'faker';
import { TestingModule } from '@nestjs/testing';
import { Connection } from 'typeorm';
import { getConnectionToken } from '@nestjs/typeorm';
import UsersService from '~/modules/users/users.service';
import AccountsService from '~/modules/accounts/accounts.service';
import core from '@light-town/core';

describe('[Auth Module] ...', () => {
  let connection: Connection;
  let moduleFixture: TestingModule;
  let authService: AuthService;
  let usersService: UsersService;
  let accountsService: AccountsService;

  beforeAll(async () => {
    moduleFixture = await createTestingModule();

    connection = moduleFixture.get<Connection>(getConnectionToken());
    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    accountsService = moduleFixture.get<AccountsService>(AccountsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('should sign up', async () => {
    const ACCOUNT_KEY = common.genAccountKey({
      versionCode: 'A3',
      userId: faker.random.uuid(),
    });
    const VERIFIER = srp.client.deriveVerifier(
      ACCOUNT_KEY,
      faker.random.word()
    );
    const USERNAME = faker.internet.userName();

    const payload: SignUpDTO = {
      accountKey: ACCOUNT_KEY,
      salt: VERIFIER.salt,
      verifier: VERIFIER.verifier,
      username: USERNAME,
    };

    jest
      .spyOn(connection, 'transaction')
      .mockImplementation(async (func: any) => {
        return await func();
      });

    const USER_ID = faker.random.uuid();
    const userCreateFunc = jest
      .spyOn(usersService, 'create')
      .mockResolvedValueOnce({ id: USER_ID });

    const ACCOUNT_ID = faker.random.uuid();
    const accountCreateFunc = jest
      .spyOn(accountsService, 'create')
      .mockResolvedValueOnce({ id: ACCOUNT_ID });

    await authService.signUp(payload);

    expect(userCreateFunc.mock.calls.length).toEqual(1);
    expect(userCreateFunc.mock.calls[0]).toEqual([
      USERNAME,
      { avatarURL: undefined },
    ]);

    expect(accountCreateFunc.mock.calls.length).toEqual(1);
    expect(accountCreateFunc.mock.calls[0]).toEqual([
      {
        key: ACCOUNT_KEY,
        userId: USER_ID,
        salt: VERIFIER.salt,
        verifier: VERIFIER.verifier,
      },
    ]);
  });

  it('should sign in', async () => {
    const ACCOUNT_SALT = core.common.genSalt();
    const ACCOUNT_VERIFIER = core.common.genSalt();
    const ACCOUNT_KEY = common.genAccountKey({
      versionCode: 'A3',
      userId: faker.random.uuid(),
    });

    const payload: SignInDTO = {
      accountKey: ACCOUNT_KEY,
    };

    const accountFindOneFunc = jest
      .spyOn(accountsService, 'findOne')
      .mockResolvedValueOnce(<any>{
        id: faker.random.uuid(),
        key: ACCOUNT_KEY,
        salt: ACCOUNT_SALT,
        verifier: ACCOUNT_VERIFIER,
      });

    const response = await authService.signIn(payload);

    expect(accountFindOneFunc.mock.calls.length).toEqual(1);
    expect(accountFindOneFunc.mock.calls[0]).toEqual([
      {
        select: ['salt', 'verifier'],
        where: { key: ACCOUNT_KEY },
      },
    ]);

    expect(response.salt).toStrictEqual(ACCOUNT_SALT);
    expect(response.serverPublicEphemeral).toBeDefined();
  });

  it('should return random salt when account key is not found', async () => {
    const ACCOUNT_SALT = core.common.genSalt();
    const ACCOUNT_KEY = common.genAccountKey({
      versionCode: 'A3',
      userId: faker.random.uuid(),
    });

    const payload: SignInDTO = {
      accountKey: ACCOUNT_KEY,
    };

    const accountFindOneFunc = jest
      .spyOn(accountsService, 'findOne')
      .mockResolvedValueOnce(undefined);

    const response = await authService.signIn(payload);

    expect(accountFindOneFunc.mock.calls.length).toEqual(1);
    expect(accountFindOneFunc.mock.calls[0]).toEqual([
      {
        select: ['salt', 'verifier'],
        where: { key: ACCOUNT_KEY },
      },
    ]);

    expect(response.salt).not.toEqual(ACCOUNT_SALT);
    expect(response.serverPublicEphemeral).toBeDefined();
  });
});
