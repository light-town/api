import { TestingModule } from '@nestjs/testing';
import { DeviceCreatePayload, OS } from '../devices.dto';
import DevicesService from '../devices.service';
import createTestingModule from './helpers/createTestingModule';
import * as faker from 'faker';
import DevicesController from '../devices.controller';
import { NotFoundException } from '@nestjs/common';

describe('[Devices Module] ...', () => {
  let moduleFixture: TestingModule;
  let devicesService: DevicesService;
  let devicesController: DevicesController;

  beforeAll(async () => {
    moduleFixture = await createTestingModule();

    devicesService = moduleFixture.get<DevicesService>(DevicesService);
    devicesController = moduleFixture.get<DevicesController>(DevicesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
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
    const TEST_HOSTNAME = faker.internet.ip();
    const TEST_USER_AGENT = faker.internet.userAgent();
    const TEST_REQ: any = {
      header: jest.fn(),
      ip: `some-trash:${TEST_HOSTNAME}`,
    };

    TEST_REQ.header.mockReturnValueOnce(TEST_USER_AGENT);

    const createDeviceFunc = jest
      .spyOn(devicesService, 'create')
      .mockReturnValueOnce(<any>TEST_DEVICE);

    const device = await devicesController.createDevice(TEST_REQ, TEST_PAYLOAD);

    expect(device).toStrictEqual({ deviceUuid: TEST_DEVICE.id });

    expect(createDeviceFunc).toBeCalledTimes(1);
    expect(createDeviceFunc).toBeCalledWith({
      ...TEST_PAYLOAD,
      userAgent: TEST_USER_AGENT,
      hostname: TEST_HOSTNAME,
    });
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

    const device = await devicesController.getAllDevices();

    expect(device).toStrictEqual(TEST_DEVICES);

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

    const device = await devicesController.getDevice(TEST_DEVICE.id);

    expect(device).toStrictEqual(TEST_DEVICE);

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

    try {
      await devicesController.getDevice(TEST_DEVICE_ID);
    } catch (e) {
      expect(e).toStrictEqual(
        new NotFoundException('The device was not found')
      );
    }

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

    await devicesController.deleteDevice(TEST_DEVICE.id);

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

  it('should throw error while deleting when device was not found', async () => {
    const TEST_DEVICE_ID = faker.random.uuid();
    const findOneDeviceFunc = jest
      .spyOn(devicesService, 'findOne')
      .mockReturnValueOnce(undefined);

    try {
      await devicesController.deleteDevice(TEST_DEVICE_ID);
    } catch (e) {
      expect(e).toStrictEqual(
        new NotFoundException('The device was not found')
      );
    }

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
