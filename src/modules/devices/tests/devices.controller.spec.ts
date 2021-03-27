import { INestApplication } from '@nestjs/common';
import { DeviceCreatePayload, OS } from '../devices.dto';
import DevicesService from '../devices.service';
import createTestingModule from './helpers/createTestingModule';
import * as faker from 'faker';
import Api from './helpers/api';

describe('[Devices Module] ...', () => {
  let api: Api;
  let app: INestApplication;
  let devicesService: DevicesService;

  beforeAll(async () => {
    app = await createTestingModule();

    api = new Api(app);

    devicesService = app.get<DevicesService>(DevicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create new device', async () => {
    const TEST_DEVICE = {
      id: faker.random.uuid(),
      os: OS.ANDROID,
      userAgent: faker.internet.userAgent(),
      hostname: faker.random.word(),
    };
    const TEST_PAYLOAD: DeviceCreatePayload = {
      os: TEST_DEVICE.os,
    };
    const TEST_HOSTNAME = '127.0.0.1';
    const TEST_USER_AGENT = undefined;

    const createDeviceFunc = jest
      .spyOn(devicesService, 'create')
      .mockReturnValueOnce(<any>TEST_DEVICE);

    const response = await api.createDevice(TEST_PAYLOAD);

    expect(response.status).toEqual(201);
    expect(response.body).toStrictEqual({
      data: { deviceUuid: TEST_DEVICE.id },
      statusCode: 201,
    });

    expect(createDeviceFunc).toBeCalledTimes(1);
    expect(createDeviceFunc).toBeCalledWith({
      ...TEST_PAYLOAD,
      userAgent: TEST_USER_AGENT,
      hostname: TEST_HOSTNAME,
    });
  });

  it('should throw validation error when os is null', async () => {
    const TEST_DEVICE = {
      id: faker.random.uuid(),
      os: OS.ANDROID,
      userAgent: faker.internet.userAgent(),
      hostname: faker.random.word(),
    };
    const TEST_PAYLOAD: DeviceCreatePayload = {
      os: null,
    };

    const createDeviceFunc = jest
      .spyOn(devicesService, 'create')
      .mockReturnValueOnce(<any>TEST_DEVICE);

    const response = await api.createDevice(TEST_PAYLOAD);

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: {
        type: 'Validation Error',
        properties: { os: ['The os must be a valid enum value'] },
      },
      statusCode: 400,
    });
    expect(createDeviceFunc).toBeCalledTimes(0);
  });

  it('should return all devices', async () => {
    const TEST_DEVICES = [
      {
        id: faker.random.uuid(),
        os: OS.ANDROID,
        userAgent: faker.internet.userAgent(),
        hostname: faker.random.word(),
      },
      {
        id: faker.random.uuid(),
        os: OS.ANDROID,
        userAgent: faker.internet.userAgent(),
        hostname: faker.random.word(),
      },
      {
        id: faker.random.uuid(),
        os: OS.ANDROID,
        userAgent: faker.internet.userAgent(),
        hostname: faker.random.word(),
      },
    ];
    const findDevicesFunc = jest
      .spyOn(devicesService, 'find')
      .mockReturnValueOnce(<any>TEST_DEVICES);

    const response = await api.getDevices();

    expect(response.status).toEqual(200);
    expect(response.body).toStrictEqual({
      data: TEST_DEVICES,
      statusCode: 200,
    });

    expect(findDevicesFunc).toBeCalledTimes(1);
    expect(findDevicesFunc).toBeCalledWith({
      select: ['id', 'os', 'userAgent', 'hostname'],
      where: {
        isDeleted: false,
      },
    });
  });

  it('should find one device', async () => {
    const TEST_DEVICE = {
      id: faker.random.uuid(),
      os: OS.ANDROID,
      userAgent: faker.internet.userAgent(),
      hostname: faker.random.word(),
    };

    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockReturnValueOnce(<any>TEST_DEVICE);

    const response = await api.getDevice(TEST_DEVICE.id);

    expect(response.status).toEqual(200);
    expect(response.body).toStrictEqual({
      data: TEST_DEVICE,
      statusCode: 200,
    });

    expect(findOneDeviceFunc).toBeCalledTimes(1);
    expect(findOneDeviceFunc).toBeCalledWith({
      select: ['id', 'os', 'userAgent', 'hostname'],
      where: {
        id: TEST_DEVICE.id,
        isDeleted: false,
      },
    });
  });

  it('should throw error while find one device when the device was not found', async () => {
    const TEST_DEVICE_ID = faker.random.uuid();
    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockReturnValueOnce(undefined);

    const response = await api.getDevice(TEST_DEVICE_ID);

    expect(response.status).toEqual(404);
    expect(response.body).toStrictEqual({
      error: {
        type: 'Not Found',
        message: 'The device was not found',
      },
      statusCode: 404,
    });

    expect(findOneDeviceFunc).toBeCalledTimes(1);
    expect(findOneDeviceFunc).toBeCalledWith({
      select: ['id', 'os', 'userAgent', 'hostname'],
      where: {
        id: TEST_DEVICE_ID,
        isDeleted: false,
      },
    });
  });

  it('should detete device', async () => {
    const TEST_DEVICE = {
      id: faker.random.uuid(),
      os: OS.ANDROID,
      userAgent: faker.internet.userAgent(),
      hostname: faker.random.word(),
    };

    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockReturnValueOnce(<any>TEST_DEVICE);

    const updateDeviceFunc = jest.spyOn(devicesService, 'update');

    const response = await api.removeDevice(TEST_DEVICE.id);

    expect(response.status).toEqual(200);
    expect(response.body).toStrictEqual({
      statusCode: 200,
    });

    expect(findOneDeviceFunc).toBeCalledTimes(1);
    expect(findOneDeviceFunc).toBeCalledWith({
      select: ['id'],
      where: {
        id: TEST_DEVICE.id,
        isDeleted: false,
      },
    });

    expect(updateDeviceFunc).toBeCalledTimes(1);
    expect(updateDeviceFunc).toBeCalledWith(
      {
        id: TEST_DEVICE.id,
      },
      { isDeleted: true }
    );
  });

  it('should throw error while deleting device when device was not found', async () => {
    const TEST_DEVICE_ID = faker.random.uuid();
    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockReturnValueOnce(undefined);

    const response = await api.removeDevice(TEST_DEVICE_ID);

    expect(response.status).toEqual(404);
    expect(response.body).toStrictEqual({
      error: {
        type: 'Not Found',
        message: 'The device was not found',
      },
      statusCode: 404,
    });

    expect(findOneDeviceFunc).toBeCalledTimes(1);
    expect(findOneDeviceFunc).toBeCalledWith({
      select: ['id'],
      where: {
        id: TEST_DEVICE_ID,
        isDeleted: false,
      },
    });
  });
});
