import { AuthService } from '../auth.service';
import { createTestingModule } from './helpers/createTestingModule';
import core from '@light-town/core';
import { MFATypesEnum, SignInPayload } from '../auth.dto';
import * as faker from 'faker';
import * as uuid from 'uuid';
import * as dotenv from 'dotenv';
import { TestingModule } from '@nestjs/testing';
import AccountsService from '~/modules/accounts/accounts.service';
import SessionsService from '~/modules/sessions/sessions.service';
import DevicesService from '~/modules/devices/devices.service';

dotenv.config();

describe('[Unit] [Auth Module] ...', () => {
  let moduleFixture: TestingModule;
  let authService: AuthService;
  let accountsService: AccountsService;
  let sessionsService: SessionsService;
  let devicesService: DevicesService;

  beforeAll(async () => {
    moduleFixture = await createTestingModule();

    authService = moduleFixture.get<AuthService>(AuthService);
    accountsService = moduleFixture.get<AccountsService>(AccountsService);
    sessionsService = moduleFixture.get<SessionsService>(SessionsService);
    devicesService = moduleFixture.get<DevicesService>(DevicesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should sign in', async () => {
    const TEST_ACCOUNT = {
      id: faker.random.uuid(),
      key: core.common.generateAccountKey({
        versionCode: 'A3',
        secret: core.common.generateCryptoRandomString(32),
      }),
      salt: core.common.generateRandomSalt(32),
      verifier: core.common.generateRandomSalt(32),
      mfaType: {
        id: faker.random.uuid(),
        name: MFATypesEnum.NONE,
      },
    };

    const TEST_SESSION = {
      id: faker.random.uuid(),
    };

    const TEST_DEVICE_ID = faker.random.uuid();
    const TEST_DEVICE_UUID = faker.random.uuid();

    const payload: SignInPayload = {
      accountKey: TEST_ACCOUNT.key,
      deviceUuid: TEST_DEVICE_UUID,
    };

    const accountFindOneFunc = jest
      .spyOn(accountsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_ACCOUNT)
      .mockResolvedValueOnce(<any>TEST_ACCOUNT);

    const deviceFineOneFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(<any>{
        id: TEST_DEVICE_ID,
        uuid: TEST_DEVICE_UUID,
      });

    const sessionCreateFunc = jest
      .spyOn(sessionsService, 'create')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    const response = await authService.signIn(payload);

    expect(accountFindOneFunc).toBeCalledTimes(1);
    expect(accountFindOneFunc).toBeCalledWith({
      select: ['id', 'salt', 'verifier', 'mfaType'],
      where: { key: TEST_ACCOUNT.key, isDeleted: false },
      join: {
        alias: 'accounts',
        leftJoinAndSelect: {
          mfaType: 'accounts.mfaType',
        },
      },
    });

    expect(deviceFineOneFunc).toBeCalledTimes(1);
    expect(deviceFineOneFunc).toBeCalledWith({
      select: ['id'],
      where: { id: TEST_DEVICE_UUID, isDeleted: false },
    });

    expect(sessionCreateFunc).toBeCalledTimes(1);
    expect(sessionCreateFunc).toBeCalledWith({
      accountId: TEST_ACCOUNT.id,
      deviceId: TEST_DEVICE_ID,
      secret: sessionCreateFunc.mock.calls[0][0].secret,
      mfaTypes: undefined,
    });

    expect(response).toStrictEqual({
      sessionUuid: response.sessionUuid,
      salt: TEST_ACCOUNT.salt,
      serverPublicEphemeral: response.serverPublicEphemeral,
      mfaType: MFATypesEnum.NONE,
    });
    expect(response.serverPublicEphemeral).toBeDefined();
    expect(uuid.version(response.sessionUuid)).toEqual(4);
    expect(uuid.validate(response.sessionUuid)).toBeTruthy();
  });

  it('should return random salt when account is not found', async () => {
    const TEST_ACCOUNT = {
      id: faker.random.uuid(),
      key: core.common.generateAccountKey({
        versionCode: 'A3',
        secret: core.common.generateCryptoRandomString(32),
      }),
      salt: core.common.generateRandomSalt(32),
      verifier: core.common.generateRandomSalt(32),
    };
    const TEST_DEVICE_UUID = faker.random.uuid();

    const payload: SignInPayload = {
      accountKey: TEST_ACCOUNT.key,
      deviceUuid: TEST_DEVICE_UUID,
    };

    const accountFindOneFunc = jest
      .spyOn(accountsService, 'findOne')
      .mockResolvedValueOnce(undefined);

    const response = await authService.signIn(payload);

    expect(accountFindOneFunc).toBeCalledTimes(1);
    expect(accountFindOneFunc).toBeCalledWith({
      select: ['id', 'salt', 'verifier', 'mfaType'],
      where: { key: TEST_ACCOUNT.key, isDeleted: false },
      join: {
        alias: 'accounts',
        leftJoinAndSelect: {
          mfaType: 'accounts.mfaType',
        },
      },
    });

    expect(response.salt).not.toEqual(TEST_ACCOUNT.salt);
    expect(response.serverPublicEphemeral).toBeDefined();
    expect(uuid.version(response.sessionUuid)).toEqual(4);
    expect(uuid.validate(response.sessionUuid)).toBeTruthy();
  });

  it('should return random salt when device is not found', async () => {
    const TEST_ACCOUNT = {
      id: faker.random.uuid(),
      key: core.common.generateAccountKey({
        versionCode: 'A3',
        secret: core.common.generateCryptoRandomString(32),
      }),
      salt: core.common.generateRandomSalt(32),
      verifier: core.common.generateRandomSalt(32),
    };
    const TEST_DEVICE_UUID = faker.random.uuid();

    const payload: SignInPayload = {
      accountKey: TEST_ACCOUNT.key,
      deviceUuid: TEST_DEVICE_UUID,
    };

    const accountFindOneFunc = jest
      .spyOn(accountsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_ACCOUNT);

    const deviceFindOneFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(undefined);

    const response = await authService.signIn(payload);

    expect(accountFindOneFunc).toBeCalledTimes(1);
    expect(accountFindOneFunc).toBeCalledWith({
      select: ['id', 'salt', 'verifier', 'mfaType'],
      where: { key: TEST_ACCOUNT.key, isDeleted: false },
      join: {
        alias: 'accounts',
        leftJoinAndSelect: {
          mfaType: 'accounts.mfaType',
        },
      },
    });

    expect(deviceFindOneFunc).toBeCalledTimes(1);
    expect(deviceFindOneFunc).toBeCalledWith({
      select: ['id'],
      where: { id: TEST_DEVICE_UUID, isDeleted: false },
    });

    expect(response.salt).not.toEqual(TEST_ACCOUNT.salt);
    expect(response.serverPublicEphemeral).toBeDefined();
    expect(uuid.version(response.sessionUuid)).toEqual(4);
    expect(uuid.validate(response.sessionUuid)).toBeTruthy();
  });
});
