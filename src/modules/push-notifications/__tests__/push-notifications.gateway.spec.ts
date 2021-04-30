import { TestingModule } from '@nestjs/testing';
import PushNotificationsGateway, {
  PushNotificationEventsEnum,
} from '../push-notifications.gateway';
import PushNotificationsService from '../push-notifications.service';
import createTestingModule from './helpers/createTestingModule';
import faker from 'faker';
import { PushNotificationStageEnum } from '../push-notifications.dto';
import { In } from 'typeorm';
import GatewayNamespacesEnum from '~/common/gateway-namespaces';
import WebSocket from 'ws';
import {
  ApiInternalServerException,
  ApiNotFoundException,
} from '~/common/exceptions';

jest.mock('ws', () => function () {});

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

  beforeEach(() => {
    (pushNotificationsGateway as any).connectedDevices.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it(`should subscribe to notify and send all push notifications`, async () => {
    const TEST_DEVICE_ID = faker.datatype.uuid();
    const TEST_DEVICE_CLIENT: any = {
      send: jest.fn(),
      close: jest.fn(),
    };
    const TEST_STAGES: any = [
      { id: faker.datatype.uuid(), name: PushNotificationStageEnum.CREATED },
      { id: faker.datatype.uuid(), name: PushNotificationStageEnum.SENT },
    ];
    const TEST_PUSH_NOTIFICATIONS: any = [
      { id: faker.datatype.uuid() },
      { id: faker.datatype.uuid() },
      { id: faker.datatype.uuid() },
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

    await pushNotificationsGateway.onSubNotifyEvent(TEST_DEVICE_CLIENT, {
      deviceUuid: TEST_DEVICE_ID,
    });

    expect(existsRecipientFunc).toBeCalledTimes(1);
    expect(existsRecipientFunc).toBeCalledWith(TEST_DEVICE_ID);

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
        recipientDeviceId: TEST_DEVICE_ID,
      },
    });

    expect(sendPushNotificationsFunc).toBeCalledTimes(3);
    expect(sendPushNotificationsFunc.mock.calls).toEqual([
      [TEST_PUSH_NOTIFICATIONS[0].id],
      [TEST_PUSH_NOTIFICATIONS[1].id],
      [TEST_PUSH_NOTIFICATIONS[2].id],
    ]);
  });

  it(`should throw error when device was not found`, async () => {
    const TEST_DEVICE_CLIENT: any = {
      send: jest.fn(),
      close: jest.fn(),
    };

    const clientSendFunc = jest.spyOn(TEST_DEVICE_CLIENT, 'send');

    await pushNotificationsGateway.onSubNotifyEvent(TEST_DEVICE_CLIENT, {
      deviceUuid: null,
    });

    expect(clientSendFunc).toBeCalledTimes(1);
    expect(clientSendFunc).toBeCalledWith(
      JSON.stringify({
        namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
        event: PushNotificationEventsEnum.ERROR,
        error: {
          message: 'The device was not found',
        },
      })
    );
  });

  it(`should throw error when '${PushNotificationStageEnum.CREATED}' and '${PushNotificationStageEnum.SENT}' push notification stages was not found`, async () => {
    const TEST_DEVICE_ID = faker.datatype.uuid();
    const TEST_DEVICE_CLIENT: any = {
      send: jest.fn(),
      close: jest.fn(),
    };

    const existsRecipientFunc = jest
      .spyOn(pushNotificationsService, 'existsRecipient')
      .mockResolvedValueOnce(true);
    const findStagesFunc = jest
      .spyOn(pushNotificationsService, 'findStages')
      .mockResolvedValueOnce([]);

    try {
      await pushNotificationsGateway.onSubNotifyEvent(TEST_DEVICE_CLIENT, {
        deviceUuid: TEST_DEVICE_ID,
      });
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiInternalServerException(
          `The '${PushNotificationStageEnum.CREATED}' and '${PushNotificationStageEnum.SENT}' push notification stages were not found`
        )
      );
    }

    expect(existsRecipientFunc).toBeCalledTimes(1);
    expect(existsRecipientFunc).toBeCalledWith(TEST_DEVICE_ID);

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

  it('should correctly unsubscribe from notifications', async () => {
    const TEST_DEVICE: any = {
      id: faker.datatype.uuid(),
    };
    const TEST_CLIENT_DEVICE: any = {
      id: faker.datatype.uuid(),
      send: jest.fn(),
    };

    await pushNotificationsGateway.onSubNotifyEvent(TEST_CLIENT_DEVICE, {
      deviceUuid: TEST_DEVICE.id,
    });

    await pushNotificationsGateway.onUnsubNotifyEvent(TEST_CLIENT_DEVICE);

    expect(
      (pushNotificationsGateway as any).connectedDevices.get(TEST_CLIENT_DEVICE)
    ).toBeUndefined();

    expect((pushNotificationsGateway as any).connectedDevices.size).toEqual(0);
  });

  it('should correctly send push notification', async () => {
    const TEST_DEVICE: any = {
      id: faker.datatype.uuid(),
    };
    const TEST_CLIENT_DEVICE: any = {
      id: faker.datatype.uuid(),
      send: jest.fn(),
    };
    const TEST_PUSH_NOTIFICATION: any = {
      id: faker.datatype.uuid(),
      payload: {},
      recipientDeviceId: TEST_DEVICE.id,
    };
    const TEST_STAGE: any = {
      id: faker.datatype.uuid(),
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

    (pushNotificationsGateway as any).connectedDevices.set(
      TEST_CLIENT_DEVICE,
      TEST_DEVICE.id
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
        namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
        event: PushNotificationEventsEnum.ARRIVED_NOTIFICATION,
        data: TEST_PUSH_NOTIFICATION.payload,
        metadata: {
          __notificationId: TEST_PUSH_NOTIFICATION.id,
        },
      })
    );
  });

  it('should find connected device', () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_CLIENT_DEVICE = new WebSocket('');

    (pushNotificationsGateway as any).connectedDevices.set(
      TEST_CLIENT_DEVICE,
      TEST_DEVICE.id
    );

    expect(
      pushNotificationsGateway.hasConnectedDevice(TEST_DEVICE.id)
    ).toBeTruthy();
  });

  it('should correctly find connected device', () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_CLIENT_DEVICE: any = {
      id: faker.datatype.uuid(),
    };

    (pushNotificationsGateway as any).connectedDevices.set(
      TEST_CLIENT_DEVICE,
      TEST_DEVICE.id
    );

    expect(
      pushNotificationsGateway.findClientByDeviceId(TEST_DEVICE.id)
    ).toEqual(TEST_CLIENT_DEVICE);
  });
  it('should correctly delete client device from pool', () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_CLIENT_DEVICE: any = {
      id: faker.datatype.uuid(),
    };

    (pushNotificationsGateway as any).connectedDevices.set(
      TEST_CLIENT_DEVICE,
      TEST_DEVICE.id
    );

    pushNotificationsGateway.handleDisconnect(TEST_CLIENT_DEVICE);

    expect(
      pushNotificationsGateway.hasConnectedDevice(TEST_DEVICE.id)
    ).toBeFalsy();
  });

  it('should throw an error while sending a push notification that is not exists', async () => {
    const TEST_DEVICE: any = {
      id: faker.datatype.uuid(),
    };
    const TEST_PUSH_NOTIFICATION: any = {
      id: faker.datatype.uuid(),
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
        new ApiNotFoundException(`The push notification was not found`)
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
      id: faker.datatype.uuid(),
    };
    const TEST_PUSH_NOTIFICATION: any = {
      id: faker.datatype.uuid(),
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
        new ApiNotFoundException(`The client device is not connected`)
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
      id: faker.datatype.uuid(),
    };
    const TEST_CLIENT_DEVICE: any = {
      id: faker.datatype.uuid(),
    };
    const TEST_PUSH_NOTIFICATION: any = {
      id: faker.datatype.uuid(),
      payload: {},
      recipientDeviceId: TEST_DEVICE.id,
    };

    const findOnePushNotificationsFunc = jest
      .spyOn(pushNotificationsService, 'findOne')
      .mockResolvedValueOnce(TEST_PUSH_NOTIFICATION);

    (pushNotificationsGateway as any).connectedDevices.set(
      TEST_CLIENT_DEVICE,
      TEST_DEVICE.id
    );

    try {
      await pushNotificationsGateway.send(TEST_PUSH_NOTIFICATION.id);
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiInternalServerException(
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

  it('should confirm arrived notification', async () => {
    const TEST_DEVICE: any = {
      id: faker.datatype.uuid(),
    };
    const TEST_CLIENT_DEVICE: any = {
      id: faker.datatype.uuid(),
      send: jest.fn(),
    };
    const TEST_PUSH_NOTIFICATION: any = {
      id: faker.datatype.uuid(),
      payload: {},
      recipientDeviceId: TEST_DEVICE.id,
    };

    const confirmNotificationFunc = jest
      .spyOn(pushNotificationsService, 'confirm')
      .mockResolvedValueOnce();

    await pushNotificationsGateway.onConfirmArrivedNotification(
      TEST_CLIENT_DEVICE,
      {
        pushNotificationId: TEST_PUSH_NOTIFICATION.id,
      }
    );

    expect(confirmNotificationFunc).toBeCalledTimes(1);
    expect(confirmNotificationFunc).toBeCalledWith(TEST_PUSH_NOTIFICATION.id);

    expect(TEST_CLIENT_DEVICE.send).toBeCalledTimes(1);
    expect(TEST_CLIENT_DEVICE.send).toBeCalledWith(
      JSON.stringify({
        namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
        event: PushNotificationEventsEnum.NOTIFICATION_STATUS,
        status: 'ok',
      })
    );
  });
});
