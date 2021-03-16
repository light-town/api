import { AuthService } from '../auth.service';
import { createTestingModule } from './helpers/createTestingModule';
import { common } from '@light-town/core';
import { SignInPayload } from '../auth.dto';
import * as faker from 'faker';
import * as uuid from 'uuid';
import * as dotenv from 'dotenv';
import { TestingModule } from '@nestjs/testing';
import AccountsService from '~/modules/accounts/accounts.service';
import core from '@light-town/core';
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
    jest.resetAllMocks();
  });

  it('should sign in', async () => {
    const TEST_ACCOUNT = {
      id: faker.random.uuid(),
      key: common.genAccountKey({
        versionCode: 'A3',
        userId: faker.random.uuid(),
      }),
      salt: core.common.genSalt(),
      verifier: core.common.genSalt(),
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
      select: ['id', 'salt', 'verifier'],
      where: { key: TEST_ACCOUNT.key },
    });

    expect(deviceFineOneFunc).toBeCalledTimes(1);
    expect(deviceFineOneFunc).toBeCalledWith({
      select: ['id'],
      where: { id: TEST_DEVICE_UUID },
    });

    expect(sessionCreateFunc).toBeCalledTimes(1);
    expect(sessionCreateFunc).toBeCalledWith({
      accountId: TEST_ACCOUNT.id,
      deviceId: TEST_DEVICE_ID,
      secret: sessionCreateFunc.mock.calls[0][0].secret,
    });

    expect(response.salt).toStrictEqual(TEST_ACCOUNT.salt);
    expect(response.serverPublicEphemeral).toBeDefined();
    expect(uuid.version(response.sessionUuid)).toEqual(4);
    expect(uuid.validate(response.sessionUuid)).toBeTruthy();
  });

  it('should return random salt when account is not found', async () => {
    const TEST_ACCOUNT = {
      id: faker.random.uuid(),
      key: common.genAccountKey({
        versionCode: 'A3',
        userId: faker.random.uuid(),
      }),
      salt: core.common.genSalt(),
      verifier: core.common.genSalt(),
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
      select: ['id', 'salt', 'verifier'],
      where: { key: TEST_ACCOUNT.key },
    });

    expect(response.salt).not.toEqual(TEST_ACCOUNT.salt);
    expect(response.serverPublicEphemeral).toBeDefined();
    expect(uuid.version(response.sessionUuid)).toEqual(4);
    expect(uuid.validate(response.sessionUuid)).toBeTruthy();
  });

  it('should return random salt when device is not found', async () => {
    const TEST_ACCOUNT = {
      id: faker.random.uuid(),
      key: common.genAccountKey({
        versionCode: 'A3',
        userId: faker.random.uuid(),
      }),
      salt: core.common.genSalt(),
      verifier: core.common.genSalt(),
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
      select: ['id', 'salt', 'verifier'],
      where: { key: TEST_ACCOUNT.key },
    });

    expect(deviceFindOneFunc).toBeCalledTimes(1);
    expect(deviceFindOneFunc).toBeCalledWith({
      select: ['id'],
      where: { id: TEST_DEVICE_UUID },
    });

    expect(response.salt).not.toEqual(TEST_ACCOUNT.salt);
    expect(response.serverPublicEphemeral).toBeDefined();
    expect(uuid.version(response.sessionUuid)).toEqual(4);
    expect(uuid.validate(response.sessionUuid)).toBeTruthy();
  });
});
