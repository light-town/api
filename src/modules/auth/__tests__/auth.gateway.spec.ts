import { TestingModule } from '@nestjs/testing';
import faker from 'faker';
import {
  ApiConflictException,
  ApiNotFoundException,
} from '~/common/exceptions';
import GatewayNamespacesEnum from '~/common/gateway-namespaces';
import DevicesService from '~/modules/devices/devices.service';
import {
  SessionVerificationStageEnum,
  SESSION_EXPIRES_AT,
} from '~/modules/sessions/sessions.dto';
import SessionsService from '~/modules/sessions/sessions.service';
import AuthGateway, { AuthEventsEnum } from '../auth.gateway';
import createModuleHelper from './helpers/create-module.helper';

jest.mock('ws', () => function () {});

describe('[Auth Module] [Gateway]...', () => {
  let moduleFixture: TestingModule;
  let authGateway: AuthGateway;
  let devicesService: DevicesService;
  let sessionsService: SessionsService;

  beforeAll(async () => {
    moduleFixture = await createModuleHelper();

    authGateway = await moduleFixture.get<AuthGateway>(AuthGateway);
    devicesService = await moduleFixture.get<DevicesService>(DevicesService);
    sessionsService = await moduleFixture.get<SessionsService>(SessionsService);
  });

  afterEach(() => {
    (authGateway as any).connectedDevices.clear();

    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should subscribe for updating a session status', async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      secret: faker.random.word(),
      expiresAt: new Date(Date.now() + SESSION_EXPIRES_AT),
      deviceId: TEST_DEVICE.id,
      verificationStage: {
        name: SessionVerificationStageEnum.REQUIRED,
      },
    };
    const TEST_DEVICE_CLIENT = {
      id: faker.datatype.uuid(),
      send: jest.fn(),
    };

    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_DEVICE);

    const findOneSessionFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    await authGateway.onSubsSessionVerify(
      <any>TEST_DEVICE_CLIENT,
      <any>{ deviceUuid: TEST_DEVICE.id, sessionUuid: TEST_SESSION.id }
    );

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
      select: ['id', 'verificationStage', 'expiresAt'],
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

    expect((authGateway as any).connectedDevices.size).toEqual(1);
    expect(
      (authGateway as any).connectedDevices.has(TEST_DEVICE_CLIENT)
    ).toBeTruthy();
    expect(
      (authGateway as any).connectedDevices.get(TEST_DEVICE_CLIENT)
    ).toStrictEqual({
      deviceUuid: TEST_DEVICE.id,
      sessionUuid: TEST_SESSION.id,
    });
  });

  it('should throw error while subscribe for updating a session status when device was not found', async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      secret: faker.random.word(),
      expiresAt: new Date(Date.now()),
      deviceId: TEST_DEVICE.id,
      verifyStage: {
        name: SessionVerificationStageEnum.REQUIRED,
      },
    };
    const TEST_DEVICE_CLIENT = {
      id: faker.datatype.uuid(),
      send: jest.fn(),
    };

    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(undefined);

    const findOneSessionFunc = jest.spyOn(sessionsService, 'findOne');

    try {
      await authGateway.onSubsSessionVerify(
        <any>TEST_DEVICE_CLIENT,
        <any>{ deviceUuid: TEST_DEVICE.id, sessionUuid: TEST_SESSION.id }
      );
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiNotFoundException('The device was not found')
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

    expect(findOneSessionFunc).toBeCalledTimes(0);
    expect((authGateway as any).connectedDevices.size).toEqual(0);
  });

  it('should throw error while subscribe for updating a session status when session was not found', async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      secret: faker.random.word(),
      expiresAt: new Date(Date.now() + SESSION_EXPIRES_AT),
      deviceId: TEST_DEVICE.id,
      verificationStage: {
        name: SessionVerificationStageEnum.REQUIRED,
      },
    };
    const TEST_DEVICE_CLIENT = {
      id: faker.datatype.uuid(),
      send: jest.fn(),
    };

    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_DEVICE);

    const findOneSessionFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(undefined);

    try {
      await authGateway.onSubsSessionVerify(
        <any>TEST_DEVICE_CLIENT,
        <any>{ deviceUuid: TEST_DEVICE.id, sessionUuid: TEST_SESSION.id }
      );
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiNotFoundException('The session was not found')
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
      select: ['id', 'verificationStage', 'expiresAt'],
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

    expect((authGateway as any).connectedDevices.size).toEqual(0);
  });

  it(`should throw error while subscribe for updating a session status when session status already ${SessionVerificationStageEnum.COMPLETED} or ${SessionVerificationStageEnum.NOT_REQUIRED}`, async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      secret: faker.random.word(),
      expiresAt: new Date(Date.now() + SESSION_EXPIRES_AT),
      deviceId: TEST_DEVICE.id,
      verificationStage: {
        name: SessionVerificationStageEnum.COMPLETED,
      },
    };
    const TEST_DEVICE_CLIENT = {
      id: faker.datatype.uuid(),
      send: jest.fn(),
    };

    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_DEVICE);

    const findOneSessionFunc = jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    try {
      await authGateway.onSubsSessionVerify(
        <any>TEST_DEVICE_CLIENT,
        <any>{ deviceUuid: TEST_DEVICE.id, sessionUuid: TEST_SESSION.id }
      );
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiConflictException(
          'The session verify has already completed or not required at all'
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
      select: ['id', 'verificationStage', 'expiresAt'],
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

    expect((authGateway as any).connectedDevices.size).toEqual(0);
  });
  it('should unsubscribe for updating a session status', async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      secret: faker.random.word(),
      expiresAt: new Date(Date.now() + SESSION_EXPIRES_AT),
      deviceId: TEST_DEVICE.id,
      verificationStage: {
        name: SessionVerificationStageEnum.REQUIRED,
      },
    };
    const TEST_DEVICE_CLIENT = {
      id: faker.datatype.uuid(),
      send: jest.fn(),
    };

    jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_DEVICE);

    jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    await authGateway.onSubsSessionVerify(
      <any>TEST_DEVICE_CLIENT,
      <any>{ deviceUuid: TEST_DEVICE.id, sessionUuid: TEST_SESSION.id }
    );

    await authGateway.onUnsubsSessionVerify(<any>TEST_DEVICE_CLIENT);

    expect((authGateway as any).connectedDevices.size).toEqual(0);
  });

  it('should unsubscribe for updating a session status while client disconnecting', async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      secret: faker.random.word(),
      expiresAt: new Date(Date.now() + SESSION_EXPIRES_AT),
      deviceId: TEST_DEVICE.id,
      verificationStage: {
        name: SessionVerificationStageEnum.REQUIRED,
      },
    };
    const TEST_DEVICE_CLIENT = {
      id: faker.datatype.uuid(),
      send: jest.fn(),
    };

    jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_DEVICE);

    jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION);

    await authGateway.onSubsSessionVerify(
      <any>TEST_DEVICE_CLIENT,
      <any>{ deviceUuid: TEST_DEVICE.id, sessionUuid: TEST_SESSION.id }
    );

    await authGateway.handleDisconnect(<any>TEST_DEVICE_CLIENT);

    expect((authGateway as any).connectedDevices.size).toEqual(0);
  });

  it('should send to all devices updated verify state session', async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      secret: faker.random.word(),
      expiresAt: new Date(Date.now() + SESSION_EXPIRES_AT),
      deviceId: TEST_DEVICE.id,
      verificationStage: {
        name: SessionVerificationStageEnum.REQUIRED,
      },
    };
    const TEST_DEVICE_CLIENT = {
      id: faker.datatype.uuid(),
      send: jest.fn(),
    };

    jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_DEVICE);

    jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION)
      .mockResolvedValueOnce(<any>{
        ...TEST_SESSION,
        verificationStage: {
          name: SessionVerificationStageEnum.COMPLETED,
        },
      });

    await authGateway.onSubsSessionVerify(
      <any>TEST_DEVICE_CLIENT,
      <any>{ deviceUuid: TEST_DEVICE.id, sessionUuid: TEST_SESSION.id }
    );

    await authGateway.updatedSessionVerifyStage(<any>TEST_SESSION);

    expect(TEST_DEVICE_CLIENT.send).toHaveBeenCalledTimes(2);
    expect(TEST_DEVICE_CLIENT.send).toHaveBeenNthCalledWith(
      1,
      JSON.stringify({
        namespace: GatewayNamespacesEnum.AUTH,
        event: AuthEventsEnum.SUB_STATUS,
        status: 'ok',
      })
    );
    expect(TEST_DEVICE_CLIENT.send).toHaveBeenNthCalledWith(
      2,
      JSON.stringify({
        namespace: GatewayNamespacesEnum.AUTH,
        event: AuthEventsEnum.CHANGED_SESSION_VERIFICATION_STAGE,
        data: {
          stage: SessionVerificationStageEnum.COMPLETED,
        },
      })
    );
  });

  it('should throw error while send to all devices a updated verify state session when session was not found', async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_SESSION = {
      id: faker.datatype.uuid(),
      secret: faker.random.word(),
      expiresAt: new Date(Date.now() + SESSION_EXPIRES_AT),
      deviceId: TEST_DEVICE.id,
      verificationStage: {
        name: SessionVerificationStageEnum.REQUIRED,
      },
    };
    const TEST_DEVICE_CLIENT = {
      id: faker.datatype.uuid(),
      send: jest.fn(),
    };

    jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_DEVICE);

    jest
      .spyOn(sessionsService, 'findOne')
      .mockResolvedValueOnce(<any>TEST_SESSION)
      .mockResolvedValueOnce(undefined);

    await authGateway.onSubsSessionVerify(
      <any>TEST_DEVICE_CLIENT,
      <any>{ deviceUuid: TEST_DEVICE.id, sessionUuid: TEST_SESSION.id }
    );

    try {
      await authGateway.updatedSessionVerifyStage(<any>TEST_SESSION);
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiNotFoundException('The session was not found')
      );
    }

    expect(TEST_DEVICE_CLIENT.send).toBeCalledTimes(1);
  });
});
