import { TestingModule } from '@nestjs/testing';
import PushNotificationsGateway, {
  PushNotificationEvents,
} from '../push-notifications.gateway';
import PushNotificationsService from '../push-notifications.service';
import createTestingModule from './helpers/createTestingModule';
import * as faker from 'faker';
import { PushNotificationStageEnum } from '../push-notifications.dto';
import { In } from 'typeorm';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

describe('[Push Notifications] ...', () => {
  let moduleFixture: TestingModule;
  let pushNotificationsGateway: PushNotificationsGateway;
  let pushNotificationsService: PushNotificationsService;

  beforeAll(async () => {
    moduleFixture = await createTestingModule();

    pushNotificationsGateway = await moduleFixture.get<PushNotificationsGateway>(
      PushNotificationsGateway
    );
    pushNotificationsService = await moduleFixture.get<PushNotificationsService>(
      PushNotificationsService
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it(`should send all push notifications`, async () => {
    const DEVICE_ID = faker.random.uuid();
    const TEST_DEVICE_CLIENT: any = {
      send: jest.fn(),
      close: jest.fn(),
    };
    const TEST_REQUEST: any = {
      url: `/?deviceUuid=${DEVICE_ID}`,
    };
    const TEST_STAGES: any = [
      { id: faker.random.uuid(), name: PushNotificationStageEnum.CREATED },
      { id: faker.random.uuid(), name: PushNotificationStageEnum.SENT },
    ];
    const TEST_PUSH_NOTIFICATIONS: any = [
      { id: faker.random.uuid() },
      { id: faker.random.uuid() },
      { id: faker.random.uuid() },
    ];

    const existsRecipientFunc = jest
      .spyOn(pushNotificationsService, 'existsRecipient')
      .mockResolvedValueOnce(true);

    const findStagesFunc = jest
      .spyOn(pushNotificationsService, 'findStages')
      .mockResolvedValueOnce(TEST_STAGES);

    const findPushNotificationsFunc = jest
      .spyOn(pushNotificationsService, 'find')
      .mockResolvedValueOnce(TEST_PUSH_NOTIFICATIONS);

    const sendPushNotificationsFunc = jest
      .spyOn(pushNotificationsGateway, 'send')
      .mockResolvedValue();

    await pushNotificationsGateway.handleConnection(
      TEST_DEVICE_CLIENT,
      TEST_REQUEST
    );

    expect(existsRecipientFunc).toBeCalledTimes(1);
    expect(existsRecipientFunc).toBeCalledWith(DEVICE_ID);

    expect(findStagesFunc).toBeCalledTimes(1);
    expect(findStagesFunc).toBeCalledWith({
      select: ['id'],
      where: {
        name: In([
          PushNotificationStageEnum.CREATED,
          PushNotificationStageEnum.SENT,
        ]),
      },
    });

    expect(findPushNotificationsFunc).toBeCalledTimes(1);
    expect(findPushNotificationsFunc).toBeCalledWith({
      select: ['id', 'payload', 'recipientDeviceId'],
      where: {
        stageId: In(TEST_STAGES.map(s => s.id)),
      },
    });

    expect(sendPushNotificationsFunc).toBeCalledTimes(3);
    expect(sendPushNotificationsFunc.mock.calls).toEqual([
      [TEST_PUSH_NOTIFICATIONS[0].id],
      [TEST_PUSH_NOTIFICATIONS[1].id],
      [TEST_PUSH_NOTIFICATIONS[2].id],
    ]);
  });

  it(`should throw 'Unauthorized' error when request has url '/'`, async () => {
    const TEST_DEVICE_CLIENT: any = {
      send: jest.fn(),
      close: jest.fn(),
    };
    const TEST_REQUEST: any = {
      url: '/',
    };

    const clientSendFunc = jest.spyOn(TEST_DEVICE_CLIENT, 'send');
    const clientCloseFunc = jest.spyOn(TEST_DEVICE_CLIENT, 'close');

    await pushNotificationsGateway.handleConnection(
      TEST_DEVICE_CLIENT,
      TEST_REQUEST
    );

    expect(clientSendFunc).toBeCalledTimes(1);
    expect(clientSendFunc).toBeCalledWith(
      JSON.stringify({
        event: PushNotificationEvents.ERROR,
        data: {
          message: 'Unauthorized',
        },
      })
    );

    expect(clientCloseFunc).toBeCalledTimes(1);
    expect(clientCloseFunc).toBeCalledWith();
  });

  it(`should throw 'Unauthorized' error when request has url '/?'`, async () => {
    const TEST_DEVICE_CLIENT: any = {
      send: jest.fn(),
      close: jest.fn(),
    };
    const TEST_REQUEST: any = {
      url: '/?',
    };

    const clientSendFunc = jest.spyOn(TEST_DEVICE_CLIENT, 'send');
    const clientCloseFunc = jest.spyOn(TEST_DEVICE_CLIENT, 'close');

    await pushNotificationsGateway.handleConnection(
      TEST_DEVICE_CLIENT,
      TEST_REQUEST
    );

    expect(clientSendFunc).toBeCalledTimes(1);
    expect(clientSendFunc).toBeCalledWith(
      JSON.stringify({
        event: PushNotificationEvents.ERROR,
        data: {
          message: 'Unauthorized',
        },
      })
    );

    expect(clientCloseFunc).toBeCalledTimes(1);
    expect(clientCloseFunc).toBeCalledWith();
  });

  it(`should throw 'Unauthorized' error when request has url without device uuid`, async () => {
    const TEST_DEVICE_CLIENT: any = {
      send: jest.fn(),
      close: jest.fn(),
    };
    const TEST_REQUEST: any = {
      url: '/?somekey=somevalue',
    };

    const clientSendFunc = jest.spyOn(TEST_DEVICE_CLIENT, 'send');
    const clientCloseFunc = jest.spyOn(TEST_DEVICE_CLIENT, 'close');

    await pushNotificationsGateway.handleConnection(
      TEST_DEVICE_CLIENT,
      TEST_REQUEST
    );

    expect(clientSendFunc).toBeCalledTimes(1);
    expect(clientSendFunc).toBeCalledWith(
      JSON.stringify({
        event: PushNotificationEvents.ERROR,
        data: {
          message: 'Unauthorized',
        },
      })
    );

    expect(clientCloseFunc).toBeCalledTimes(1);
    expect(clientCloseFunc).toBeCalledWith();
  });

  it(`should throw 'Unauthorized' error when recipient device is not exists`, async () => {
    const DEVICE_ID = faker.random.uuid();
    const TEST_DEVICE_CLIENT: any = {
      send: jest.fn(),
      close: jest.fn(),
    };
    const TEST_REQUEST: any = {
      url: `/?deviceUuid=${DEVICE_ID}`,
    };

    const existsRecipientFunc = jest
      .spyOn(pushNotificationsService, 'existsRecipient')
      .mockResolvedValueOnce(undefined);
    const clientSendFunc = jest.spyOn(TEST_DEVICE_CLIENT, 'send');
    const clientCloseFunc = jest.spyOn(TEST_DEVICE_CLIENT, 'close');

    await pushNotificationsGateway.handleConnection(
      TEST_DEVICE_CLIENT,
      TEST_REQUEST
    );

    expect(clientSendFunc).toBeCalledTimes(1);
    expect(clientSendFunc).toBeCalledWith(
      JSON.stringify({
        event: PushNotificationEvents.ERROR,
        data: {
          message: 'Unauthorized',
        },
      })
    );

    expect(clientCloseFunc).toBeCalledTimes(1);
    expect(clientCloseFunc).toBeCalledWith();

    expect(existsRecipientFunc).toBeCalledTimes(1);
    expect(existsRecipientFunc).toBeCalledWith(DEVICE_ID);
  });

  it(`should throw error when '${PushNotificationStageEnum.CREATED}' and '${PushNotificationStageEnum.SENT}' push notification stages was not found`, async () => {
    const DEVICE_ID = faker.random.uuid();
    const TEST_DEVICE_CLIENT: any = {
      send: jest.fn(),
      close: jest.fn(),
    };
    const TEST_REQUEST: any = {
      url: `/?deviceUuid=${DEVICE_ID}`,
    };

    const existsRecipientFunc = jest
      .spyOn(pushNotificationsService, 'existsRecipient')
      .mockResolvedValueOnce(true);
    const findStagesFunc = jest
      .spyOn(pushNotificationsService, 'findStages')
      .mockResolvedValueOnce([]);

    try {
      await pushNotificationsGateway.handleConnection(
        TEST_DEVICE_CLIENT,
        TEST_REQUEST
      );
    } catch (e) {
      expect(e).toStrictEqual(
        new InternalServerErrorException(
          `The '${PushNotificationStageEnum.CREATED}' and '${PushNotificationStageEnum.SENT}' push notification stages were not found`
        )
      );
    }

    expect(existsRecipientFunc).toBeCalledTimes(1);
    expect(existsRecipientFunc).toBeCalledWith(DEVICE_ID);

    expect(findStagesFunc).toBeCalledTimes(1);
    expect(findStagesFunc).toBeCalledWith({
      select: ['id'],
      where: {
        name: In([
          PushNotificationStageEnum.CREATED,
          PushNotificationStageEnum.SENT,
        ]),
      },
    });
  });

  it('should correctly send push notification', async () => {
    const TEST_DEVICE: any = {
      id: faker.random.uuid(),
    };
    const TEST_CLIENT_DEVICE: any = {
      id: faker.random.uuid(),
      send: jest.fn(),
    };
    const TEST_PUSH_NOTIFICATION: any = {
      id: faker.random.uuid(),
      payload: {},
      recipientDeviceId: TEST_DEVICE.id,
    };
    const TEST_STAGE: any = {
      id: faker.random.uuid(),
      name: PushNotificationStageEnum.SENT,
    };

    const findOnePushNotificationsFunc = jest
      .spyOn(pushNotificationsService, 'findOne')
      .mockResolvedValueOnce(TEST_PUSH_NOTIFICATION);

    const findOneStageFunc = jest
      .spyOn(pushNotificationsService, 'findOneStage')
      .mockResolvedValueOnce(TEST_STAGE);

    const updatPushNotificationFunc = jest
      .spyOn(pushNotificationsService, 'update')
      .mockImplementationOnce(<any>(() => {}));

    pushNotificationsGateway.connectedDevices.set(
      TEST_DEVICE.id,
      TEST_CLIENT_DEVICE
    );

    await pushNotificationsGateway.send(TEST_PUSH_NOTIFICATION.id);

    expect(findOnePushNotificationsFunc).toBeCalledTimes(1);
    expect(findOnePushNotificationsFunc).toBeCalledWith({
      select: ['id', 'payload', 'recipientDeviceId'],
      where: { id: TEST_PUSH_NOTIFICATION.id },
    });

    expect(findOneStageFunc).toBeCalledTimes(1);
    expect(findOneStageFunc).toBeCalledWith({
      select: ['id'],
      where: {
        name: PushNotificationStageEnum.SENT,
      },
    });

    expect(updatPushNotificationFunc).toBeCalledTimes(1);
    expect(updatPushNotificationFunc).toBeCalledWith(
      {
        id: TEST_PUSH_NOTIFICATION.id,
      },
      { stageId: TEST_STAGE.id }
    );

    expect(TEST_CLIENT_DEVICE.send).toBeCalledTimes(1);
    expect(TEST_CLIENT_DEVICE.send).toBeCalledWith(
      JSON.stringify({
        ...TEST_PUSH_NOTIFICATION.payload,
        __id: TEST_PUSH_NOTIFICATION.id,
      })
    );
  });

  it('should find connected device', () => {
    const TEST_DEVICE = {
      id: faker.random.uuid(),
    };
    const TEST_CLIENT_DEVICE: any = {
      id: faker.random.uuid(),
    };

    pushNotificationsGateway.connectedDevices.set(
      TEST_DEVICE.id,
      TEST_CLIENT_DEVICE
    );

    expect(
      pushNotificationsGateway.hasConnectedDevice(TEST_DEVICE.id)
    ).toBeTruthy();
  });

  it('should correctly find connected device', () => {
    const TEST_DEVICE = {
      id: faker.random.uuid(),
    };
    const TEST_CLIENT_DEVICE: any = {
      id: faker.random.uuid(),
    };

    pushNotificationsGateway.connectedDevices.set(
      TEST_DEVICE.id,
      TEST_CLIENT_DEVICE
    );

    expect(pushNotificationsGateway.findDeviceId(TEST_CLIENT_DEVICE)).toEqual(
      TEST_DEVICE.id
    );
  });
  it('should correctly delete client device from pool', () => {
    const TEST_DEVICE = {
      id: faker.random.uuid(),
    };
    const TEST_CLIENT_DEVICE: any = {
      id: faker.random.uuid(),
    };

    pushNotificationsGateway.connectedDevices.set(
      TEST_DEVICE.id,
      TEST_CLIENT_DEVICE
    );

    pushNotificationsGateway.handleDisconnect(TEST_CLIENT_DEVICE);

    expect(
      pushNotificationsGateway.connectedDevices.has(TEST_DEVICE.id)
    ).toBeFalsy();
  });

  it('should throw an error while sending a push notification that is not exists', async () => {
    const TEST_DEVICE: any = {
      id: faker.random.uuid(),
    };
    const TEST_PUSH_NOTIFICATION: any = {
      id: faker.random.uuid(),
      payload: {},
      recipientDeviceId: TEST_DEVICE.id,
    };

    const findOnePushNotificationsFunc = jest
      .spyOn(pushNotificationsService, 'findOne')
      .mockResolvedValueOnce(undefined);

    try {
      await pushNotificationsGateway.send(TEST_PUSH_NOTIFICATION.id);
    } catch (e) {
      expect(e).toStrictEqual(
        new NotFoundException(`The push notification was not found`)
      );
    }

    expect(findOnePushNotificationsFunc).toBeCalledTimes(1);
    expect(findOnePushNotificationsFunc).toBeCalledWith({
      select: ['id', 'payload', 'recipientDeviceId'],
      where: {
        id: TEST_PUSH_NOTIFICATION.id,
      },
    });
  });

  it('should throw error when send are being while client device not connected', async () => {
    const TEST_DEVICE: any = {
      id: faker.random.uuid(),
    };
    const TEST_PUSH_NOTIFICATION: any = {
      id: faker.random.uuid(),
      payload: {},
      recipientDeviceId: TEST_DEVICE.id,
    };

    const findOnePushNotificationsFunc = jest
      .spyOn(pushNotificationsService, 'findOne')
      .mockResolvedValueOnce(TEST_PUSH_NOTIFICATION);

    try {
      await pushNotificationsGateway.send(TEST_PUSH_NOTIFICATION.id);
    } catch (e) {
      expect(e).toStrictEqual(
        new NotFoundException(`The client device is not connected`)
      );
    }

    expect(findOnePushNotificationsFunc).toBeCalledTimes(1);
    expect(findOnePushNotificationsFunc).toBeCalledWith({
      select: ['id', 'payload', 'recipientDeviceId'],
      where: {
        id: TEST_PUSH_NOTIFICATION.id,
      },
    });
  });

  it(`should throw error when ${PushNotificationStageEnum.SENT} push notification stage was not found`, async () => {
    const TEST_DEVICE: any = {
      id: faker.random.uuid(),
    };
    const TEST_CLIENT_DEVICE: any = {
      id: faker.random.uuid(),
    };
    const TEST_PUSH_NOTIFICATION: any = {
      id: faker.random.uuid(),
      payload: {},
      recipientDeviceId: TEST_DEVICE.id,
    };

    const findOnePushNotificationsFunc = jest
      .spyOn(pushNotificationsService, 'findOne')
      .mockResolvedValueOnce(TEST_PUSH_NOTIFICATION);

    pushNotificationsGateway.connectedDevices.set(
      TEST_DEVICE.id,
      TEST_CLIENT_DEVICE
    );

    try {
      await pushNotificationsGateway.send(TEST_PUSH_NOTIFICATION.id);
    } catch (e) {
      expect(e).toStrictEqual(
        new InternalServerErrorException(
          `The '${PushNotificationStageEnum.SENT}' push notification stage was not found`
        )
      );
    }

    expect(findOnePushNotificationsFunc).toBeCalledTimes(1);
    expect(findOnePushNotificationsFunc).toBeCalledWith({
      select: ['id', 'payload', 'recipientDeviceId'],
      where: {
        id: TEST_PUSH_NOTIFICATION.id,
      },
    });
  });
});
