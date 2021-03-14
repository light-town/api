import { AuthService } from '../auth.service';
import { createTestingModule } from './helpers/createTestingModule';
import { srp, common } from '@light-town/core';
import { SignUpDTO } from '../auth.dto';
import * as faker from 'faker';
import { TestingModule } from '@nestjs/testing';
import { Connection } from 'typeorm';
import { getConnectionToken } from '@nestjs/typeorm';
import UsersService from '~/modules/users/users.service';
import AccountsService from '~/modules/accounts/accounts.service';

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
        userId: USER_ID,
        salt: VERIFIER.salt,
        verifier: VERIFIER.verifier,
      },
    ]);
  });
});
