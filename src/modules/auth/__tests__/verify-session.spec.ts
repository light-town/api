import { AuthService } from '../auth.service';
import { createTestingModule } from './helpers/createTestingModule';
import * as faker from 'faker';
import * as dotenv from 'dotenv';
import { TestingModule } from '@nestjs/testing';
import SessionsService from '~/modules/sessions/sessions.service';
import {
  SessionVerificationStageEnum,
  SESSION_EXPIRES_AT,
} from '~/modules/sessions/sessions.dto';
import DevicesService from '~/modules/devices/devices.service';
import {
  ApiForbiddenException,
  ApiInternalServerException,
  ApiNotFoundException,
} from '~/common/exceptions';

dotenv.config();

describe('[Unit] [Auth Module] ...', () => {
  let moduleFixture: TestingModule;
  let sessionsService: SessionsService;
  let authService: AuthService;
  let devicesService: DevicesService;

  beforeAll(async () => {
    moduleFixture = await createTestingModule();

    sessionsService = moduleFixture.get<SessionsService>(SessionsService);
    authService = moduleFixture.get<AuthService>(AuthService);
    devicesService = moduleFixture.get<DevicesService>(DevicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should verify session', async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      expiresAt: new Date(new Date().getTime() + SESSION_EXPIRES_AT),
      verificationDevice: {
        deviceId: TEST_DEVICE.id,
      },
      verificationStage: {
        name: SessionVerificationStageEnum.REQUIRED,
      },
    };

    const TEST_SESSION_VERIFY_STAGE = {
      id: faker.datatype.uuid(),
    };

    const findOneSessionFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION)
      .mockResolvedValueOnce(<any>TEST_SESSION);

    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_DEVICE);

    const findOneVerifyStageFunc = jest
      .spyOn(sessionsService, 'findOneVerificationStage')
      .mockResolvedValueOnce(<any>TEST_SESSION_VERIFY_STAGE);

    const updateSessionFunc = jest
      .spyOn(sessionsService, 'update')
      .mockResolvedValueOnce(<any>{});

    const response = await authService.verifySession(
      TEST_SESSION.id,
      TEST_DEVICE.id
    );

    expect(response.stage).toEqual(SessionVerificationStageEnum.COMPLETED);

    expect(findOneSessionFunc).toBeCalledTimes(2);
    expect(findOneSessionFunc.mock.calls[0][0]).toStrictEqual({
      select: [
        'id',
        'deviceId',
        'verificationStage',
        'expiresAt',
        'verificationDevice',
      ],
      where: {
        id: TEST_SESSION.id,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verificationStage: 'sessions.verificationStage',
          verificationDevice: 'sessions.verificationDevice',
        },
      },
    });
    expect(findOneSessionFunc.mock.calls[1][0]).toStrictEqual({
      select: ['id', 'deviceId', 'verificationStage'],
      where: {
        id: TEST_SESSION.id,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verificationStage: 'sessions.verificationStage',
        },
      },
    });

    expect(findOneDeviceFunc).toBeCalledTimes(1);
    expect(findOneDeviceFunc).toBeCalledWith({
      select: ['id'],
      where: {
        id: TEST_DEVICE.id,
        isDeleted: false,
      },
    });

    expect(findOneVerifyStageFunc).toBeCalledTimes(1);
    expect(findOneVerifyStageFunc).toBeCalledWith({
      select: ['id'],
      where: {
        name: SessionVerificationStageEnum.COMPLETED,
        isDeleted: false,
      },
    });

    expect(updateSessionFunc).toBeCalledTimes(1);
    expect(updateSessionFunc).toBeCalledWith(
      { id: TEST_SESSION.id },
      { verificationStageId: TEST_SESSION_VERIFY_STAGE.id }
    );
  });

  it('should throw error when session was not found', async () => {
    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      verificationStage: {
        name: SessionVerificationStageEnum.REQUIRED,
      },
    };

    const TEST_SESSION_VERIFY_STAGE = {
      id: faker.datatype.uuid(),
    };

    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };

    const findOneSessionFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(undefined);

    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_DEVICE);

    const findOneVerifyStageFunc = jest
      .spyOn(sessionsService, 'findOneVerificationStage')
      .mockResolvedValueOnce(<any>TEST_SESSION_VERIFY_STAGE);

    const updateSessionFunc = jest
      .spyOn(sessionsService, 'update')
      .mockResolvedValueOnce(<any>{});

    try {
      await authService.verifySession(TEST_SESSION.id, TEST_DEVICE.id);
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiNotFoundException('The session was not found')
      );
    }

    expect(findOneSessionFunc).toBeCalledTimes(1);
    expect(findOneSessionFunc).toBeCalledWith({
      select: [
        'id',
        'deviceId',
        'verificationStage',
        'expiresAt',
        'verificationDevice',
      ],
      where: {
        id: TEST_SESSION.id,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verificationStage: 'sessions.verificationStage',
          verificationDevice: 'sessions.verificationDevice',
        },
      },
    });

    expect(findOneVerifyStageFunc).toBeCalledTimes(0);
    expect(updateSessionFunc).toBeCalledTimes(0);
    expect(findOneDeviceFunc).toBeCalledTimes(0);
  });

  it(`should return current verify stage when session verify stage is not ${SessionVerificationStageEnum.REQUIRED}`, async () => {
    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      expiresAt: new Date(new Date().getTime() + SESSION_EXPIRES_AT),
      verificationStage: {
        name: SessionVerificationStageEnum.NOT_REQUIRED,
      },
    };

    const TEST_SESSION_VERIFY_STAGE = {
      id: faker.datatype.uuid(),
    };

    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };

    const findOneSessionFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    const findOneVerifyStageFunc = jest
      .spyOn(sessionsService, 'findOneVerificationStage')
      .mockResolvedValueOnce(<any>TEST_SESSION_VERIFY_STAGE);

    const updateSessionFunc = jest
      .spyOn(sessionsService, 'update')
      .mockResolvedValueOnce(<any>{});

    expect(
      await authService.verifySession(TEST_SESSION.id, TEST_DEVICE.id)
    ).toStrictEqual({
      stage: TEST_SESSION.verificationStage.name,
    });

    expect(findOneSessionFunc).toBeCalledTimes(1);
    expect(findOneSessionFunc).toBeCalledWith({
      select: [
        'id',
        'deviceId',
        'verificationStage',
        'expiresAt',
        'verificationDevice',
      ],
      where: {
        id: TEST_SESSION.id,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verificationStage: 'sessions.verificationStage',
          verificationDevice: 'sessions.verificationDevice',
        },
      },
    });

    expect(findOneVerifyStageFunc).toBeCalledTimes(0);
    expect(updateSessionFunc).toBeCalledTimes(0);
  });

  it(`should throw error when ${SessionVerificationStageEnum.COMPLETED} session verify stage was not found`, async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };

    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      expiresAt: new Date(new Date().getTime() + SESSION_EXPIRES_AT),
      verificationDevice: { deviceId: TEST_DEVICE.id },
      verificationStage: {
        name: SessionVerificationStageEnum.REQUIRED,
      },
    };

    const findOneSessionFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_DEVICE);

    const findOneVerifyStageFunc = jest
      .spyOn(sessionsService, 'findOneVerificationStage')
      .mockResolvedValueOnce(undefined);

    const updateSessionFunc = jest
      .spyOn(sessionsService, 'update')
      .mockResolvedValueOnce(<any>{});

    try {
      await authService.verifySession(TEST_SESSION.id, TEST_DEVICE.id);
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiInternalServerException(
          `The '${SessionVerificationStageEnum.COMPLETED}' session verify stage was not found`
        )
      );
    }

    expect(findOneDeviceFunc).toBeCalledTimes(1);
    expect(findOneDeviceFunc).toBeCalledWith({
      select: ['id'],
      where: {
        id: TEST_DEVICE.id,
        isDeleted: false,
      },
    });

    expect(findOneSessionFunc).toBeCalledTimes(1);
    expect(findOneSessionFunc).toBeCalledWith({
      select: [
        'id',
        'deviceId',
        'verificationStage',
        'expiresAt',
        'verificationDevice',
      ],
      where: {
        id: TEST_SESSION.id,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verificationStage: 'sessions.verificationStage',
          verificationDevice: 'sessions.verificationDevice',
        },
      },
    });

    expect(findOneVerifyStageFunc).toBeCalledTimes(1);
    expect(findOneVerifyStageFunc).toBeCalledWith({
      select: ['id'],
      where: {
        name: SessionVerificationStageEnum.COMPLETED,
        isDeleted: false,
      },
    });

    expect(updateSessionFunc).toBeCalledTimes(0);
  });

  it(`should throw an error when session is expired`, async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };

    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      expiresAt: new Date(Date.now() - SESSION_EXPIRES_AT),
      verificationDevice: { deviceId: TEST_DEVICE.id },
      verificationStage: {
        name: SessionVerificationStageEnum.REQUIRED,
      },
    };

    const findOneSessionFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_DEVICE);

    const findOneVerifyStageFunc = jest
      .spyOn(sessionsService, 'findOneVerificationStage')
      .mockResolvedValueOnce(undefined);

    const updateSessionFunc = jest
      .spyOn(sessionsService, 'update')
      .mockResolvedValueOnce(<any>{});

    try {
      await authService.verifySession(TEST_SESSION.id, TEST_DEVICE.id);
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiForbiddenException(`The session is expired`)
      );
    }

    expect(findOneDeviceFunc).toBeCalledTimes(0);
    expect(findOneVerifyStageFunc).toBeCalledTimes(0);
    expect(updateSessionFunc).toBeCalledTimes(0);

    expect(findOneSessionFunc).toBeCalledTimes(1);
    expect(findOneSessionFunc).toBeCalledWith({
      select: [
        'id',
        'deviceId',
        'verificationStage',
        'expiresAt',
        'verificationDevice',
      ],
      where: {
        id: TEST_SESSION.id,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verificationStage: 'sessions.verificationStage',
          verificationDevice: 'sessions.verificationDevice',
        },
      },
    });
  });

  it(`should throw an error when verification devices is not match`, async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };

    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      expiresAt: new Date(new Date().getTime() + SESSION_EXPIRES_AT),
      verificationDevice: { deviceId: faker.datatype.uuid() },
      verificationStage: {
        name: SessionVerificationStageEnum.REQUIRED,
      },
    };

    const findOneSessionFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_DEVICE);

    const findOneVerifyStageFunc = jest
      .spyOn(sessionsService, 'findOneVerificationStage')
      .mockResolvedValueOnce(undefined);

    const updateSessionFunc = jest
      .spyOn(sessionsService, 'update')
      .mockResolvedValueOnce(<any>{});

    try {
      await authService.verifySession(TEST_SESSION.id, TEST_DEVICE.id);
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiForbiddenException(
          `The got device is not for verifying the session`
        )
      );
    }

    expect(findOneDeviceFunc).toBeCalledTimes(1);
    expect(findOneDeviceFunc).toBeCalledWith({
      select: ['id'],
      where: {
        id: TEST_DEVICE.id,
        isDeleted: false,
      },
    });

    expect(findOneSessionFunc).toBeCalledTimes(1);
    expect(findOneSessionFunc).toBeCalledWith({
      select: [
        'id',
        'deviceId',
        'verificationStage',
        'expiresAt',
        'verificationDevice',
      ],
      where: {
        id: TEST_SESSION.id,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verificationStage: 'sessions.verificationStage',
          verificationDevice: 'sessions.verificationDevice',
        },
      },
    });

    expect(findOneVerifyStageFunc).toBeCalledTimes(0);
    expect(updateSessionFunc).toBeCalledTimes(0);
  });
});
