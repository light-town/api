import { TestingModule } from '@nestjs/testing';
import PushNotificationsGateway from '../push-notifications.gateway';
import PushNotificationsService from '../push-notifications.service';
import createTestingModule from './helpers/createTestingModule';
import * as faker from 'faker';
import { PushNotificationStageEnum } from '../push-notifications.dto';
import { Repository } from 'typeorm';
import PushNotificationStageEntity from '~/db/entities/push-notification-stage.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import PushNotificationEntity from '~/db/entities/push-notification.entity';
import DevicesService from '~/modules/devices/devices.service';
import DeviceEntity from '~/db/entities/device.entity';
import {
  ApiInternalServerException,
  ApiNotFoundException,
} from '~/common/exceptions';

describe('[Push Notifications] ...', () => {
  let moduleFixture: TestingModule;
  let pushNotificationsGateway: PushNotificationsGateway;
  let pushNotificationsService: PushNotificationsService;
  let pushNotificationStagesRepository: Repository<PushNotificationStageEntity>;
  let pushNotificationsRepository: Repository<PushNotificationEntity>;
  let devicesService: DevicesService;

  beforeAll(async () => {
    moduleFixture = await createTestingModule();

    pushNotificationsGateway = moduleFixture.get<PushNotificationsGateway>(
      PushNotificationsGateway
    );
    pushNotificationsService = moduleFixture.get<PushNotificationsService>(
      PushNotificationsService
    );
    pushNotificationStagesRepository = moduleFixture.get<
      Repository<PushNotificationStageEntity>
    >(getRepositoryToken(PushNotificationStageEntity));

    pushNotificationsRepository = moduleFixture.get<
      Repository<PushNotificationEntity>
    >(getRepositoryToken(PushNotificationEntity));

    devicesService = moduleFixture.get<DevicesService>(DevicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should send a push notification', async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_EVENT_PAYLOAD = {
      message: faker.random.word(),
    };
    const TEST_CREATED_STAGE: any = {
      id: faker.datatype.uuid(),
      name: PushNotificationStageEnum.CREATED,
    };
    const TEST_PUSH_NOTIFICATION: any = {
      id: faker.datatype.uuid(),
    };

    const existsRecipientFunc = jest
      .spyOn(pushNotificationsService, 'existsRecipient')
      .mockResolvedValueOnce(true);

    const findOneStageFunc = jest
      .spyOn(pushNotificationStagesRepository, 'findOne')
      .mockResolvedValueOnce(TEST_CREATED_STAGE);

    const hasConnectedDeviceFunc = jest
      .spyOn(pushNotificationsGateway, 'hasConnectedDevice')
      .mockReturnValue(true);

    const createFunc = jest
      .spyOn(pushNotificationsService, 'create')
      .mockResolvedValueOnce(TEST_PUSH_NOTIFICATION);

    const sendFunc = jest
      .spyOn(pushNotificationsGateway, 'send')
      .mockResolvedValueOnce();

    const response = await pushNotificationsService.send(
      TEST_DEVICE.id,
      TEST_EVENT_PAYLOAD
    );

    expect(response).toStrictEqual(TEST_PUSH_NOTIFICATION);

    expect(existsRecipientFunc).toBeCalledTimes(1);
    expect(existsRecipientFunc).toBeCalledWith(TEST_DEVICE.id);

    expect(findOneStageFunc).toBeCalledTimes(1);
    expect(findOneStageFunc).toBeCalledWith({
      select: ['id'],
      where: { name: PushNotificationStageEnum.CREATED },
    });

    expect(hasConnectedDeviceFunc).toBeCalledTimes(1);
    expect(hasConnectedDeviceFunc).toBeCalledWith(TEST_DEVICE.id);

    expect(createFunc).toBeCalledTimes(1);
    expect(createFunc).toBeCalledWith(
      TEST_DEVICE.id,
      TEST_EVENT_PAYLOAD,
      TEST_CREATED_STAGE.id
    );

    expect(sendFunc).toBeCalledTimes(1);
    expect(sendFunc).toBeCalledWith(TEST_PUSH_NOTIFICATION.id);
  });

  it('should throw error when exists recipient device was not found', async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_EVENT_PAYLOAD = {
      message: faker.random.word(),
    };

    const existsRecipientFunc = jest
      .spyOn(pushNotificationsService, 'existsRecipient')
      .mockResolvedValueOnce(false);

    const findOneStageFunc = jest.spyOn(
      pushNotificationStagesRepository,
      'findOne'
    );

    const hasConnectedDeviceFunc = jest.spyOn(
      pushNotificationsGateway,
      'hasConnectedDevice'
    );

    const createFunc = jest.spyOn(pushNotificationsService, 'create');

    const sendFunc = jest.spyOn(pushNotificationsGateway, 'send');

    try {
      await pushNotificationsService.send(TEST_DEVICE.id, TEST_EVENT_PAYLOAD);
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiNotFoundException(`The recipient device was not found`)
      );
    }

    expect(existsRecipientFunc).toBeCalledTimes(1);
    expect(existsRecipientFunc).toBeCalledWith(TEST_DEVICE.id);

    expect(findOneStageFunc).toBeCalledTimes(0);
    expect(hasConnectedDeviceFunc).toBeCalledTimes(0);
    expect(createFunc).toBeCalledTimes(0);
    expect(sendFunc).toBeCalledTimes(0);
  });

  it(`should throw error when ${PushNotificationStageEnum.CREATED} push notification stage was not found`, async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_EVENT_PAYLOAD = {
      message: faker.random.word(),
    };

    const existsRecipientFunc = jest
      .spyOn(pushNotificationsService, 'existsRecipient')
      .mockResolvedValueOnce(true);

    const findOneStageFunc = jest
      .spyOn(pushNotificationStagesRepository, 'findOne')
      .mockResolvedValueOnce(undefined);

    const hasConnectedDeviceFunc = jest.spyOn(
      pushNotificationsGateway,
      'hasConnectedDevice'
    );

    const createFunc = jest.spyOn(pushNotificationsService, 'create');

    const sendFunc = jest.spyOn(pushNotificationsGateway, 'send');

    try {
      await pushNotificationsService.send(TEST_DEVICE.id, TEST_EVENT_PAYLOAD);
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiInternalServerException(
          `The '${PushNotificationStageEnum.CREATED}' push notification stage was not found`
        )
      );
    }

    expect(existsRecipientFunc).toBeCalledTimes(1);
    expect(existsRecipientFunc).toBeCalledWith(TEST_DEVICE.id);

    expect(findOneStageFunc).toBeCalledTimes(1);
    expect(findOneStageFunc).toBeCalledWith({
      select: ['id'],
      where: { name: PushNotificationStageEnum.CREATED },
    });

    expect(hasConnectedDeviceFunc).toBeCalledTimes(0);
    expect(createFunc).toBeCalledTimes(0);
    expect(sendFunc).toBeCalledTimes(0);
  });

  it('should just return new push notification when recipient device is not connected', async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_EVENT_PAYLOAD = {
      message: faker.random.word(),
    };
    const TEST_CREATED_STAGE: any = {
      id: faker.datatype.uuid(),
      name: PushNotificationStageEnum.CREATED,
    };
    const TEST_PUSH_NOTIFICATION: any = {
      id: faker.datatype.uuid(),
    };

    const existsRecipientFunc = jest
      .spyOn(pushNotificationsService, 'existsRecipient')
      .mockResolvedValueOnce(true);

    const findOneStageFunc = jest
      .spyOn(pushNotificationStagesRepository, 'findOne')
      .mockResolvedValueOnce(TEST_CREATED_STAGE);

    const hasConnectedDeviceFunc = jest
      .spyOn(pushNotificationsGateway, 'hasConnectedDevice')
      .mockReturnValue(false);

    const createFunc = jest
      .spyOn(pushNotificationsService, 'create')
      .mockResolvedValueOnce(TEST_PUSH_NOTIFICATION);

    const sendFunc = jest.spyOn(pushNotificationsGateway, 'send');

    const response = await pushNotificationsService.send(
      TEST_DEVICE.id,
      TEST_EVENT_PAYLOAD
    );

    expect(response).toStrictEqual(TEST_PUSH_NOTIFICATION);

    expect(existsRecipientFunc).toBeCalledTimes(1);
    expect(existsRecipientFunc).toBeCalledWith(TEST_DEVICE.id);

    expect(findOneStageFunc).toBeCalledTimes(1);
    expect(findOneStageFunc).toBeCalledWith({
      select: ['id'],
      where: { name: PushNotificationStageEnum.CREATED },
    });

    expect(hasConnectedDeviceFunc).toBeCalledTimes(1);
    expect(hasConnectedDeviceFunc).toBeCalledWith(TEST_DEVICE.id);

    expect(createFunc).toBeCalledTimes(1);
    expect(createFunc).toBeCalledWith(
      TEST_DEVICE.id,
      TEST_EVENT_PAYLOAD,
      TEST_CREATED_STAGE.id
    );

    expect(sendFunc).toBeCalledTimes(0);
  });

  it('should answer positive when checking exists recipient device', async () => {
    const TEST_DEVICE: DeviceEntity = new DeviceEntity();
    TEST_DEVICE.id = faker.datatype.uuid();

    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(TEST_DEVICE);

    const response = await pushNotificationsService.existsRecipient(
      TEST_DEVICE.id
    );

    expect(response).toBeTruthy();

    expect(findOneDeviceFunc).toBeCalledTimes(1);
    expect(findOneDeviceFunc).toBeCalledWith({
      select: ['id'],
      where: { id: TEST_DEVICE.id, isDeleted: false },
    });
  });

  it('should answer negative when checking not exists recipient device', async () => {
    const TEST_DEVICE: DeviceEntity = new DeviceEntity();
    TEST_DEVICE.id = faker.datatype.uuid();

    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockResolvedValueOnce(undefined);

    const response = await pushNotificationsService.existsRecipient(
      TEST_DEVICE.id
    );

    expect(response).toBeFalsy();

    expect(findOneDeviceFunc).toBeCalledTimes(1);
    expect(findOneDeviceFunc).toBeCalledWith({
      select: ['id'],
      where: { id: TEST_DEVICE.id, isDeleted: false },
    });
  });

  it('should confirm receiving push notification', async () => {
    const TEST_ARRIVED_STAGE: any = {
      id: faker.datatype.uuid(),
      name: PushNotificationStageEnum.ARRIVED,
    };
    const TEST_PUSH_NOTIFICATION: any = {
      id: faker.datatype.uuid(),
    };

    const findOnePushNotificationFunc = jest
      .spyOn(pushNotificationsService, 'findOne')
      .mockResolvedValueOnce(TEST_PUSH_NOTIFICATION);

    const findOneStageFunc = jest
      .spyOn(pushNotificationsService, 'findOneStage')
      .mockResolvedValueOnce(TEST_ARRIVED_STAGE);

    const updatePushNotificationFunc = jest
      .spyOn(pushNotificationsRepository, 'update')
      .mockResolvedValueOnce(<any>{});

    await pushNotificationsService.confirm(TEST_PUSH_NOTIFICATION.id);

    expect(findOnePushNotificationFunc).toBeCalledTimes(1);
    expect(findOnePushNotificationFunc).toBeCalledWith({
      select: ['id', 'payload', 'recipientDeviceId'],
      where: {
        id: TEST_PUSH_NOTIFICATION.id,
      },
    });

    expect(findOneStageFunc).toBeCalledTimes(1);
    expect(findOneStageFunc).toBeCalledWith({
      select: ['id'],
      where: {
        name: PushNotificationStageEnum.ARRIVED,
      },
    });

    expect(updatePushNotificationFunc).toBeCalledTimes(1);
    expect(updatePushNotificationFunc).toBeCalledWith(
      {
        id: TEST_PUSH_NOTIFICATION.id,
      },
      { stageId: TEST_ARRIVED_STAGE.id }
    );
  });

  it('should throw error while confirmimg receiving push notification when push notifiaction was not found', async () => {
    const TEST_ARRIVED_STAGE: any = {
      id: faker.datatype.uuid(),
      name: PushNotificationStageEnum.ARRIVED,
    };
    const TEST_PUSH_NOTIFICATION: any = {
      id: faker.datatype.uuid(),
    };

    const findOnePushNotificationFunc = jest
      .spyOn(pushNotificationsService, 'findOne')
      .mockResolvedValueOnce(undefined);

    const findOneStageFunc = jest
      .spyOn(pushNotificationsService, 'findOneStage')
      .mockResolvedValueOnce(TEST_ARRIVED_STAGE);

    const updatePushNotificationFunc = jest
      .spyOn(pushNotificationsRepository, 'update')
      .mockResolvedValueOnce(<any>{});

    try {
      await pushNotificationsService.confirm(TEST_PUSH_NOTIFICATION.id);
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiNotFoundException(`The push notification was not found`)
      );
    }

    expect(findOnePushNotificationFunc).toBeCalledTimes(1);
    expect(findOnePushNotificationFunc).toBeCalledWith({
      select: ['id', 'payload', 'recipientDeviceId'],
      where: {
        id: TEST_PUSH_NOTIFICATION.id,
      },
    });

    expect(findOneStageFunc).toBeCalledTimes(0);
    expect(updatePushNotificationFunc).toBeCalledTimes(0);
  });

  it(`should throw error while confirmimg receiving push notification when ${PushNotificationStageEnum.ARRIVED} push notification stage was not found`, async () => {
    const TEST_PUSH_NOTIFICATION: any = {
      id: faker.datatype.uuid(),
    };

    const findOnePushNotificationFunc = jest
      .spyOn(pushNotificationsService, 'findOne')
      .mockResolvedValueOnce(TEST_PUSH_NOTIFICATION);

    const findOneStageFunc = jest
      .spyOn(pushNotificationsService, 'findOneStage')
      .mockResolvedValueOnce(undefined);

    const updatePushNotificationFunc = jest
      .spyOn(pushNotificationsRepository, 'update')
      .mockResolvedValueOnce(<any>{});

    try {
      await pushNotificationsService.confirm(TEST_PUSH_NOTIFICATION.id);
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiInternalServerException(
          `The '${PushNotificationStageEnum.ARRIVED}' push notification stage was not found`
        )
      );
    }

    expect(findOnePushNotificationFunc).toBeCalledTimes(1);
    expect(findOnePushNotificationFunc).toBeCalledWith({
      select: ['id', 'payload', 'recipientDeviceId'],
      where: {
        id: TEST_PUSH_NOTIFICATION.id,
      },
    });

    expect(findOneStageFunc).toBeCalledTimes(1);
    expect(findOneStageFunc).toBeCalledWith({
      select: ['id'],
      where: {
        name: PushNotificationStageEnum.ARRIVED,
      },
    });

    expect(updatePushNotificationFunc).toBeCalledTimes(0);
  });
});
