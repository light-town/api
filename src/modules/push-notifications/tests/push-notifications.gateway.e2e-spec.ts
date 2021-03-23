import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/typeorm';
import { Connection, In } from 'typeorm';
import createTestingE2EModule from './helpers/createTestingE2EModule';
import * as WebSocket from 'ws';
import * as faker from 'faker';
import { PushNotificationEventsEnum } from '../push-notifications.gateway';
import DevicesService from '~/modules/devices/devices.service';
import PushNotificationsService from '../push-notifications.service';
import initDB from './helpers/initDatabase';
import { PushNotificationStageEnum } from '../push-notifications.dto';
import { OS } from '~/modules/devices/devices.dto';
import GatewayNamespacesEnum from '~/common/gateway-namespaces';

const WS_URL = 'ws://127.0.0.1:8080';

export const removeAllEventListeners = (ws: WebSocket) => {
  ws.onopen = null;
  ws.onmessage = null;
  ws.onerror = null;
  ws.onclose = null;
};

describe('[Push Notifications]', () => {
  let connection: Connection;
  let app: INestApplication;
  let devicesService: DevicesService;
  let pushNotificationsService: PushNotificationsService;

  beforeAll(async () => {
    app = await createTestingE2EModule();

    connection = app.get<Connection>(getConnectionToken());
    await connection.synchronize(true);

    await initDB();

    devicesService = app.get<DevicesService>(DevicesService);
    pushNotificationsService = app.get<PushNotificationsService>(
      PushNotificationsService
    );

    await app.listen(8080);
  });

  beforeEach(async () => {
    await connection.query('TRUNCATE push_notifications CASCADE');
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  it('should subscribe to receive notifications', async () => {
    const device = await devicesService.create({
      os: OS.ANDROID,
      hostname: faker.internet.mac(),
    });

    const ws = new WebSocket(WS_URL);

    const response = await new Promise(res => {
      ws.onopen = ({}) => {
        ws.send(
          JSON.stringify({
            namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
            event: PushNotificationEventsEnum.SUBSCRIBE_NOTIFY,
            data: {
              deviceUuid: device.id,
            },
          })
        );
      };
      ws.onmessage = ({ data }) => res(JSON.parse(data.toString()));
      ws.onerror = e => res(e);
    });

    expect(response).toStrictEqual({
      namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
      event: PushNotificationEventsEnum.SUBSCRIBE_STATUS,
      status: 'ok',
    });

    ws.close();
  });

  it('should send push notification when device is already connected', async () => {
    const device = await devicesService.create({
      os: OS.ANDROID,
      hostname: faker.internet.mac(),
    });
    const PAYLOAD = {
      type: 'FINGERPRINT',
    };

    let notification;
    const ws = new WebSocket(WS_URL);

    const response = await new Promise(res => {
      ws.onopen = async () => {
        ws.send(
          JSON.stringify({
            namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
            event: PushNotificationEventsEnum.SUBSCRIBE_NOTIFY,
            data: {
              deviceUuid: device.id,
            },
          })
        );
        notification = await pushNotificationsService.send(device.id, PAYLOAD);
      };
      ws.onmessage = ({ data }) => {
        const response = JSON.parse(data.toString());

        if (response.event === PushNotificationEventsEnum.ARRIVED_NOTIFICATION)
          res(response);
      };
      ws.onerror = e => res(e);
    });

    expect(response).toStrictEqual({
      namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
      event: PushNotificationEventsEnum.ARRIVED_NOTIFICATION,
      data: PAYLOAD,
      metadata: {
        __notificationId: notification.id,
      },
    });

    ws.close();
  });

  it('should send push notification when device will connect', async () => {
    const device = await devicesService.create({
      os: OS.ANDROID,
      hostname: faker.internet.mac(),
    });
    const PAYLOAD = {
      type: 'FINGERPRINT',
    };

    const notification = await pushNotificationsService.send(
      device.id,
      PAYLOAD
    );

    const ws = new WebSocket(WS_URL);

    const response = await new Promise(res => {
      ws.onopen = async () => {
        ws.send(
          JSON.stringify({
            namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
            event: PushNotificationEventsEnum.SUBSCRIBE_NOTIFY,
            data: {
              deviceUuid: device.id,
            },
          })
        );
      };
      ws.onmessage = ({ data }) => {
        const response = JSON.parse(data.toString());

        if (response.event === PushNotificationEventsEnum.ARRIVED_NOTIFICATION)
          res(response);
      };
      ws.onerror = e => res(e);
    });

    expect(response).toStrictEqual({
      namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
      event: PushNotificationEventsEnum.ARRIVED_NOTIFICATION,
      data: PAYLOAD,
      metadata: {
        __notificationId: notification.id,
      },
    });

    ws.close();
  });

  it('should create several push notifications and send them when device will be connected', async () => {
    const device = await devicesService.create({
      os: OS.ANDROID,
      hostname: faker.internet.mac(),
    });

    const TEST_PAYLOADS = [
      {
        type: faker.random.uuid(),
      },
      {
        type: faker.random.uuid(),
      },
      {
        type: faker.random.uuid(),
      },
    ];

    await pushNotificationsService.send(device.id, TEST_PAYLOADS[0]);
    await pushNotificationsService.send(device.id, TEST_PAYLOADS[1]);
    await pushNotificationsService.send(device.id, TEST_PAYLOADS[2]);

    const ws = new WebSocket(WS_URL);

    const response = await new Promise(res => {
      const notifications = [];
      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
            event: PushNotificationEventsEnum.SUBSCRIBE_NOTIFY,
            data: {
              deviceUuid: device.id,
            },
          })
        );
      };
      ws.onmessage = ({ data }) => {
        const response = JSON.parse(data.toString());

        if (response.event === PushNotificationEventsEnum.ARRIVED_NOTIFICATION)
          notifications.push(response.data);

        if (notifications.length === 3) res(notifications);
      };
      ws.onerror = e => res(e);
    });

    expect(response).toEqual(TEST_PAYLOADS);

    expect((await pushNotificationsService.find()).length).toEqual(3);
    expect(
      (
        await pushNotificationsService.find({
          select: ['id'],
          where: {
            payload: In(TEST_PAYLOADS),
            stage: await pushNotificationsService.findOneStage({
              where: { name: PushNotificationStageEnum.SENT },
            }),
          },
        })
      ).length
    ).toEqual(3);

    ws.close();
  });

  it('should set ARRIVED stage in push notification', async () => {
    const device = await devicesService.create({
      os: OS.ANDROID,
      hostname: faker.internet.mac(),
    });
    const PAYLOAD = {
      type: 'FINGERPRINT',
    };

    await pushNotificationsService.send(device.id, PAYLOAD);

    const ws = new WebSocket(WS_URL);

    const response = await new Promise(res => {
      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
            event: PushNotificationEventsEnum.SUBSCRIBE_NOTIFY,
            data: {
              deviceUuid: device.id,
            },
          })
        );
      };
      ws.onmessage = ({ data }) => {
        const response = JSON.parse(data.toString());

        if (
          response.event === PushNotificationEventsEnum.ARRIVED_NOTIFICATION
        ) {
          ws.send(
            JSON.stringify({
              namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
              event: PushNotificationEventsEnum.CONFIRM_ARRIVED_NOTIFICATION,
              data: {
                pushNotificationId: response.metadata.__notificationId,
              },
            })
          );
        }

        if (response.event === PushNotificationEventsEnum.NOTIFICATION_STATUS)
          res(response);
      };
      ws.onerror = e => res(e);
    });

    ws.close();

    expect(response).toStrictEqual({
      namespace: GatewayNamespacesEnum.PUSH_NOTIFICATION,
      event: PushNotificationEventsEnum.NOTIFICATION_STATUS,
      status: 'ok',
    });
  });
});
