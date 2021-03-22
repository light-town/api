import { AuthService } from '../auth.service';
import { createTestingModule } from './helpers/createTestingModule';
import core from '@light-town/core';
import { SignUpPayload } from '../auth.dto';
import * as faker from 'faker';
import * as dotenv from 'dotenv';
import { TestingModule } from '@nestjs/testing';
import { Connection } from 'typeorm';
import { getConnectionToken } from '@nestjs/typeorm';
import UsersService from '~/modules/users/users.service';
import AccountsService from '~/modules/accounts/accounts.service';
import DevicesService from '~/modules/devices/devices.service';
import { NotFoundException } from '@nestjs/common';

dotenv.config();

describe('[Unit] [Auth Module] ...', () => {
  let connection: Connection;
  let moduleFixture: TestingModule;
  let authService: AuthService;
  let usersService: UsersService;
  let accountsService: AccountsService;
  let devicesService: DevicesService;

  beforeAll(async () => {
    moduleFixture = await createTestingModule();

    connection = moduleFixture.get<Connection>(getConnectionToken());
    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    accountsService = moduleFixture.get<AccountsService>(AccountsService);
    devicesService = moduleFixture.get<DevicesService>(DevicesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should sign up', async () => {
    const TEST_ACCOUNT_KEY = core.common.generateAccountKey({
      versionCode: 'A3',
      secret: core.common.generateCryptoRandomString(32),
    });
    const TSET_SRP_VERIFIER = core.srp.client.deriveVerifier(
      TEST_ACCOUNT_KEY,
      faker.random.word()
    );
    const TEST_USER_ID = faker.random.uuid();
    const TEST_USERNAME = faker.internet.userName();
    const TEST_DEVICE_UUID = faker.random.uuid();

    const payload: SignUpPayload = {
      accountKey: TEST_ACCOUNT_KEY,
      salt: TSET_SRP_VERIFIER.salt,
      verifier: TSET_SRP_VERIFIER.verifier,
      username: TEST_USERNAME,
      deviceUuid: faker.random.uuid(),
    };

    jest
      .spyOn(connection, 'transaction')
      .mockImplementation(async (func: any) => {
        return await func();
      });

    jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(<any>{ id: TEST_DEVICE_UUID });

    const userCreateFunc = jest
      .spyOn(usersService, 'create')
      .mockResolvedValueOnce(<any>{ id: TEST_USER_ID });

    const TEST_ACCOUNT_ID = faker.random.uuid();
    const accountCreateFunc = jest
      .spyOn(accountsService, 'create')
      .mockResolvedValueOnce({ id: TEST_ACCOUNT_ID });

    await authService.signUp(payload);

    expect(userCreateFunc).toBeCalledTimes(1);
    expect(userCreateFunc).toBeCalledWith(
      {
        name: TEST_USERNAME,
        avatarURL: undefined,
      },
      undefined
    );

    expect(accountCreateFunc).toBeCalledTimes(1);
    expect(accountCreateFunc).toBeCalledWith(
      {
        key: TEST_ACCOUNT_KEY,
        userId: TEST_USER_ID,
        salt: TSET_SRP_VERIFIER.salt,
        verifier: TSET_SRP_VERIFIER.verifier,
      },
      undefined
    );
  });

  it('should throw error whene device was not found', async () => {
    const TEST_ACCOUNT_KEY = core.common.generateAccountKey({
      versionCode: 'A3',
      secret: core.common.generateCryptoRandomString(32),
    });
    const TSET_SRP_VERIFIER = core.srp.client.deriveVerifier(
      TEST_ACCOUNT_KEY,
      faker.random.word()
    );
    const TEST_USERNAME = faker.internet.userName();

    const payload: SignUpPayload = {
      accountKey: TEST_ACCOUNT_KEY,
      salt: TSET_SRP_VERIFIER.salt,
      verifier: TSET_SRP_VERIFIER.verifier,
      username: TEST_USERNAME,
      deviceUuid: faker.random.uuid(),
    };

    jest
      .spyOn(connection, 'transaction')
      .mockImplementation(async (func: any) => {
        return func();
      });

    jest.spyOn(devicesService, 'findOne').mockResolvedValueOnce(undefined);

    expect(authService.signUp(payload)).rejects.toStrictEqual(
      new NotFoundException(`The device was not found`)
    );
  });
});
