import { AuthService } from '../auth.service';
import { createTestingModule } from './helpers/createTestingModule';
import * as faker from 'faker';
import * as dotenv from 'dotenv';
import { TestingModule } from '@nestjs/testing';
import SessionsService from '~/modules/sessions/sessions.service';
import { VerifySessionStageEnum } from '~/modules/sessions/sessions.dto';
import DevicesService from '~/modules/devices/devices.service';
import {
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
      verifyStage: {
        name: VerifySessionStageEnum.REQUIRED,
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
      .spyOn(sessionsService, 'findOneVerifyStage')
      .mockResolvedValueOnce(<any>TEST_SESSION_VERIFY_STAGE);

    const updateSessionFunc = jest
      .spyOn(sessionsService, 'update')
      .mockResolvedValueOnce(<any>{});

    const response = await authService.verifySession(
      TEST_SESSION.id,
      TEST_DEVICE.id
    );

    expect(response.stage).toEqual(VerifySessionStageEnum.COMPLETED);

    expect(findOneSessionFunc).toBeCalledTimes(2);
    expect(findOneSessionFunc.mock.calls[0][0]).toStrictEqual({
      select: ['id', 'deviceId', 'verifyStage'],
      where: {
        id: TEST_SESSION.id,
        expiresAt: (findOneSessionFunc.mock.calls[0][0].where as any).expiresAt,
        isDeleted: false,
      },
    });
    expect(findOneSessionFunc.mock.calls[1][0]).toStrictEqual({
      select: ['id', 'deviceId', 'verifyStage'],
      where: {
        id: TEST_SESSION.id,
        isDeleted: false,
      },
      join: {
        alias: 'sessions',
        leftJoinAndSelect: {
          verifyStage: 'sessions.verifyStage',
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
        name: VerifySessionStageEnum.COMPLETED,
        isDeleted: false,
      },
    });

    expect(updateSessionFunc).toBeCalledTimes(1);
    expect(updateSessionFunc).toBeCalledWith(
      { id: TEST_SESSION.id },
      { verifyStageId: TEST_SESSION_VERIFY_STAGE.id }
    );
  });

  it('should throw error when session was not found', async () => {
    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      verifyStage: {
        name: VerifySessionStageEnum.REQUIRED,
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
      .spyOn(sessionsService, 'findOneVerifyStage')
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
      select: ['id', 'deviceId', 'verifyStage'],
      where: {
        id: TEST_SESSION.id,
        expiresAt: (findOneSessionFunc.mock.calls[0][0].where as any).expiresAt,
        isDeleted: false,
      },
    });

    expect(findOneVerifyStageFunc).toBeCalledTimes(0);
    expect(updateSessionFunc).toBeCalledTimes(0);
    expect(findOneDeviceFunc).toBeCalledTimes(0);
  });

  it(`should return current verify stage when session verify stage is not ${VerifySessionStageEnum.REQUIRED}`, async () => {
    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      verifyStage: {
        name: VerifySessionStageEnum.NOT_REQUIRED,
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
      .spyOn(sessionsService, 'findOneVerifyStage')
      .mockResolvedValueOnce(<any>TEST_SESSION_VERIFY_STAGE);

    const updateSessionFunc = jest
      .spyOn(sessionsService, 'update')
      .mockResolvedValueOnce(<any>{});

    expect(
      await authService.verifySession(TEST_SESSION.id, TEST_DEVICE.id)
    ).toStrictEqual({
      stage: TEST_SESSION.verifyStage.name,
    });

    expect(findOneSessionFunc).toBeCalledTimes(1);
    expect(findOneSessionFunc).toBeCalledWith({
      select: ['id', 'deviceId', 'verifyStage'],
      where: {
        id: TEST_SESSION.id,
        expiresAt: (findOneSessionFunc.mock.calls[0][0].where as any).expiresAt,
        isDeleted: false,
      },
    });

    expect(findOneVerifyStageFunc).toBeCalledTimes(0);
    expect(updateSessionFunc).toBeCalledTimes(0);
  });

  it(`should throw error when ${VerifySessionStageEnum.COMPLETED} session verify stage was not found`, async () => {
    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      verifyStage: {
        name: VerifySessionStageEnum.REQUIRED,
      },
    };

    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };

    const findOneSessionFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_DEVICE);

    const findOneVerifyStageFunc = jest
      .spyOn(sessionsService, 'findOneVerifyStage')
      .mockResolvedValueOnce(undefined);

    const updateSessionFunc = jest
      .spyOn(sessionsService, 'update')
      .mockResolvedValueOnce(<any>{});

    try {
      await authService.verifySession(TEST_SESSION.id, TEST_DEVICE.id);
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiInternalServerException(
          `The '${VerifySessionStageEnum.COMPLETED}' session verify stage was not found`
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
      select: ['id', 'deviceId', 'verifyStage'],
      where: {
        id: TEST_SESSION.id,
        expiresAt: (findOneSessionFunc.mock.calls[0][0].where as any).expiresAt,
        isDeleted: false,
      },
    });

    expect(findOneVerifyStageFunc).toBeCalledTimes(1);
    expect(findOneVerifyStageFunc).toBeCalledWith({
      select: ['id'],
      where: {
        name: VerifySessionStageEnum.COMPLETED,
        isDeleted: false,
      },
    });

    expect(updateSessionFunc).toBeCalledTimes(0);
  });
});
