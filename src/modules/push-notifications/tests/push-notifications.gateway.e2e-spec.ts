import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/typeorm';
import { Connection, In } from 'typeorm';
import createTestingE2EModule from './helpers/createTestingE2EModule';
import * as WebSocket from 'ws';
import * as faker from 'faker';
import { PushNotificationEvents } from '../push-notifications.gateway';
import DevicesService from '~/modules/devices/devices.service';
import PushNotificationsService from '../push-notifications.service';
import initDB from './helpers/initDatabase';
import { PushNotificationStageEnum } from '../push-notifications.dto';

const WS_URL = 'ws://127.0.0.1:8080';
const CLOSE_SOCKET_EVENT = 'CLOSE_SOCKET_EVENT';
const ERROR_SOCKET_EVENT = 'ERROR_SOCKET_EVENT';
const OPEN_SOCKET_EVENT = 'OPEN_SOCKET_EVENT';

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

  it('should set right connection ', async () => {
    const device = await devicesService.create({
      op: faker.internet.domainName(),
      hostname: faker.internet.mac(),
    });

    const ws = new WebSocket(`${WS_URL}?deviceUuid=${device.id}`);

    const response = await new Promise(res => {
      ws.onopen = ({}) => {
        removeAllEventListeners(ws);
        res(OPEN_SOCKET_EVENT);
      };
      ws.onmessage = ({ data }) => res(JSON.parse(data.toString()));
      ws.onerror = e => res(e);
      ws.onclose = () => res(CLOSE_SOCKET_EVENT);
    });

    expect(response).toEqual(OPEN_SOCKET_EVENT);
  });

  it('should send push notification when device is already connected', async () => {
    const device = await devicesService.create({
      op: faker.internet.domainName(),
      hostname: faker.internet.mac(),
    });
    const EVENT_NAME = 'VERIFY_SESSION';
    const PAYLOAD = {
      type: 'FINGERPRINT',
    };

    let pushNotification;
    const ws = new WebSocket(`${WS_URL}?deviceUuid=${device.id}`);

    const response = await new Promise(res => {
      ws.onopen = async () => {
        pushNotification = await pushNotificationsService.send(
          device.id,
          EVENT_NAME,
          PAYLOAD
        );
      };
      ws.onmessage = ({ data }) => res(JSON.parse(data.toString()));
      ws.onerror = e => res(e);
      ws.onclose = () => res(CLOSE_SOCKET_EVENT);
    });

    expect(response).toEqual({
      __id: pushNotification.id,
      event: EVENT_NAME,
      data: PAYLOAD,
    });
  });

  it('should send push notification when device will connect', async () => {
    const device = await devicesService.create({
      op: faker.internet.domainName(),
      hostname: faker.internet.mac(),
    });
    const EVENT_NAME = 'VERIFY_SESSION';
    const PAYLOAD = {
      type: 'FINGERPRINT',
    };

    const pushNotification = await pushNotificationsService.send(
      device.id,
      EVENT_NAME,
      PAYLOAD
    );

    const ws = new WebSocket(`${WS_URL}?deviceUuid=${device.id}`);

    const response = await new Promise(res => {
      ws.onmessage = ({ data }) => res(JSON.parse(data.toString()));
      ws.onerror = e => res(e);
      ws.onclose = () => res(CLOSE_SOCKET_EVENT);
    });

    expect(response).toEqual({
      __id: pushNotification.id,
      event: EVENT_NAME,
      data: PAYLOAD,
    });
  });

  it('should create several push notifications and send them when device will be connected', async () => {
    const device = await devicesService.create({
      op: faker.internet.domainName(),
      hostname: faker.internet.mac(),
    });
    const EVENT_NAME = 'VERIFY_SESSION';
    const PAYLOAD = {
      type: 'FINGERPRINT',
    };

    await pushNotificationsService.send(device.id, `${EVENT_NAME}_1`, PAYLOAD);
    await pushNotificationsService.send(device.id, `${EVENT_NAME}_2`, PAYLOAD);
    await pushNotificationsService.send(device.id, `${EVENT_NAME}_3`, PAYLOAD);

    const ws = new WebSocket(`${WS_URL}?deviceUuid=${device.id}`);

    const response = await new Promise(res => {
      const notifications = {};
      ws.onmessage = ({ data }) => {
        const payload = JSON.parse(data.toString());
        notifications[payload.event] = payload.data;

        if (payload.event === `${EVENT_NAME}_3`) res(notifications);
      };
      ws.onerror = e => res(e);
      ws.onclose = () => res(CLOSE_SOCKET_EVENT);
    });

    expect(response).toEqual({
      [`${EVENT_NAME}_1`]: PAYLOAD,
      [`${EVENT_NAME}_2`]: PAYLOAD,
      [`${EVENT_NAME}_3`]: PAYLOAD,
    });

    expect((await pushNotificationsService.find()).length).toEqual(3);
    expect(
      (
        await pushNotificationsService.find({
          select: ['id'],
          where: {
            payload: In([
              { event: `${EVENT_NAME}_1`, data: PAYLOAD },
              { event: `${EVENT_NAME}_2`, data: PAYLOAD },
              { event: `${EVENT_NAME}_3`, data: PAYLOAD },
            ]),
            stage: await pushNotificationsService.findOneStage({
              where: { name: PushNotificationStageEnum.SENT },
            }),
          },
        })
      ).length
    ).toEqual(3);
  });

  it('it should set ARRIVED stage in push notification', async () => {
    const device = await devicesService.create({
      op: faker.internet.domainName(),
      hostname: faker.internet.mac(),
    });
    const EVENT_NAME = 'VERIFY_SESSION';
    const PAYLOAD = {
      type: 'FINGERPRINT',
    };

    const pushNotification = await pushNotificationsService.send(
      device.id,
      EVENT_NAME,
      PAYLOAD
    );

    const ws = new WebSocket(`${WS_URL}?deviceUuid=${device.id}`);

    const response = await new Promise(res => {
      ws.onmessage = async ({ data }) => {
        const payload = JSON.parse(data.toString());
        await pushNotificationsService.confirm(payload.__id);
        res(payload.__id);
      };
      ws.onerror = e => res(e);
      ws.onclose = () => res(CLOSE_SOCKET_EVENT);
    });

    expect(response).toEqual(pushNotification.id);
  });

  it('should return `Unauthorized` error when deviceUuid query param was not provided', async () => {
    const ws = new WebSocket(WS_URL);

    const response = await new Promise(res => {
      ws.onmessage = ({ data }) => {
        removeAllEventListeners(ws);
        res(JSON.parse(data.toString()));
      };
      ws.onerror = () => {
        res(ERROR_SOCKET_EVENT);
      };
      ws.onclose = () => {
        res(CLOSE_SOCKET_EVENT);
      };
    });

    expect(response).toStrictEqual({
      event: PushNotificationEvents.ERROR,
      data: {
        message: 'Unauthorized',
      },
    });
  });
});
