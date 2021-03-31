import { AuthService } from '../auth.service';
import { createTestingModule } from './helpers/createTestingModule';
import core from '@light-town/core';
import { MFATypesEnum, SessionCreatePayload } from '../auth.dto';
import * as faker from 'faker';
import * as uuid from 'uuid';
import * as dotenv from 'dotenv';
import { TestingModule } from '@nestjs/testing';
import AccountsService from '~/modules/accounts/accounts.service';
import SessionsService from '~/modules/sessions/sessions.service';
import DevicesService from '~/modules/devices/devices.service';
import { ApiNotFoundException } from '~/common/exceptions';
import { VerifySessionStageEnum } from '~/modules/sessions/sessions.dto';

dotenv.config();

describe('[Auth Module] [Service]...', () => {
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

  it('should create session', async () => {
    const TEST_ACCOUNT = {
      id: faker.datatype.uuid(),
      key: core.common.generateAccountKey({
        versionCode: 'A3',
        secret: core.common.generateCryptoRandomString(32),
      }),
      salt: core.common.generateRandomSalt(32),
      verifier: core.common.generateRandomSalt(32),
      mfaType: {
        id: faker.datatype.uuid(),
        name: MFATypesEnum.NONE,
      },
    };

    const TEST_SESSION = {
      id: faker.datatype.uuid(),
    };

    const TEST_DEVICE_ID = faker.datatype.uuid();
    const TEST_DEVICE_UUID = faker.datatype.uuid();

    const payload: SessionCreatePayload = {
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

    const findOneVerifyStageFunc = jest
      .spyOn(sessionsService, 'findOneVerifyStage')
      .mockResolvedValueOnce(<any>{ id: faker.datatype.uuid() });

    const response = await authService.createSession(payload);

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
      sessionVerify: {
        stage: VerifySessionStageEnum.NOT_REQUIRED,
        MFAType: TEST_ACCOUNT.mfaType.name,
      },
    });
    expect(response.serverPublicEphemeral).toBeDefined();
    expect(uuid.version(response.sessionUuid)).toEqual(4);
    expect(uuid.validate(response.sessionUuid)).toBeTruthy();

    expect(findOneVerifyStageFunc).toBeCalledTimes(1);
    expect(findOneVerifyStageFunc).toBeCalledWith({
      select: ['id'],
      where: { name: VerifySessionStageEnum.COMPLETED, isDeleted: false },
    });
  });

  it('should throw error when account is not found', async () => {
    const TEST_ACCOUNT = {
      id: faker.datatype.uuid(),
      key: core.common.generateAccountKey({
        versionCode: 'A3',
        secret: core.common.generateCryptoRandomString(32),
      }),
      salt: core.common.generateRandomSalt(32),
      verifier: core.common.generateRandomSalt(32),
    };
    const TEST_DEVICE_UUID = faker.datatype.uuid();

    const payload: SessionCreatePayload = {
      accountKey: TEST_ACCOUNT.key,
      deviceUuid: TEST_DEVICE_UUID,
    };

    const accountFindOneFunc = jest
      .spyOn(accountsService, 'findOne')
      .mockResolvedValueOnce(undefined);

    try {
      await authService.createSession(payload);
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiNotFoundException('The account was not found')
      );
    }

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
  });

  it('should throw error when device is not found', async () => {
    const TEST_ACCOUNT = {
      id: faker.datatype.uuid(),
      key: core.common.generateAccountKey({
        versionCode: 'A3',
        secret: core.common.generateCryptoRandomString(32),
      }),
      salt: core.common.generateRandomSalt(32),
      verifier: core.common.generateRandomSalt(32),
    };
    const TEST_DEVICE_UUID = faker.datatype.uuid();

    const payload: SessionCreatePayload = {
      accountKey: TEST_ACCOUNT.key,
      deviceUuid: TEST_DEVICE_UUID,
    };

    const accountFindOneFunc = jest
      .spyOn(accountsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_ACCOUNT);

    const deviceFindOneFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(undefined);

    try {
      await authService.createSession(payload);
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiNotFoundException('The device was not found')
      );
    }

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
  });
});
