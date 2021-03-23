import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import DeviceEntity from '~/db/entities/device.entity';
import { DeviceCreatePayload, OS } from '../devices.dto';
import DevicesService from '../devices.service';
import createTestingModule from './helpers/createTestingModule';
import * as faker from 'faker';

describe('[Devices Module] ...', () => {
  let moduleFixture: TestingModule;
  let devicesRepository: Repository<DeviceEntity>;
  let devicesService: DevicesService;

  beforeAll(async () => {
    moduleFixture = await createTestingModule();

    devicesRepository = moduleFixture.get<Repository<DeviceEntity>>(
      getRepositoryToken(DeviceEntity)
    );

    devicesService = moduleFixture.get<DevicesService>(DevicesService);
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
      userAgent: TEST_DEVICE.userAgent,
      hostname: TEST_DEVICE.hostname,
    };

    const createDeviceFunc = jest
      .spyOn(devicesRepository.manager, 'create')
      .mockReturnValueOnce(<any>TEST_DEVICE);

    const saveDeviceFunc = jest
      .spyOn(devicesRepository.manager, 'save')
      .mockResolvedValueOnce(<any>TEST_DEVICE);

    const device = await devicesService.create(TEST_PAYLOAD);

    expect(device).toStrictEqual(TEST_DEVICE);

    expect(createDeviceFunc).toBeCalledTimes(1);
    expect(createDeviceFunc).toBeCalledWith(DeviceEntity, TEST_PAYLOAD);

    expect(saveDeviceFunc).toBeCalledTimes(1);
    expect(saveDeviceFunc).toBeCalledWith(TEST_DEVICE);
  });

  it('should find devices', async () => {
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
    const TEST_FIND_OPTIONS: FindManyOptions<DeviceEntity> = {
      select: ['id'],
      where: {
        isDeleted: false,
      },
    };

    const findDevicesFunc = jest
      .spyOn(devicesRepository.manager, 'find')
      .mockReturnValueOnce(<any>TEST_DEVICES);

    const devices = await devicesService.find(TEST_FIND_OPTIONS);

    expect(devices).toStrictEqual(TEST_DEVICES);

    expect(findDevicesFunc).toBeCalledTimes(1);
    expect(findDevicesFunc).toBeCalledWith(DeviceEntity, TEST_FIND_OPTIONS);
  });

  it('should update device information', async () => {
    const TEST_DEVICE = {
      id: faker.random.uuid(),
      os: OS.ANDROID,
      userAgent: faker.internet.userAgent(),
      hostname: faker.random.word(),
    };
    const TEST_CRITERIA = {
      id: TEST_DEVICE.id,
    };
    const TEST_UPDATE_PROPERTY = {
      id: faker.random.uuid(),
    };

    const findDevicesFunc = jest
      .spyOn(devicesRepository.manager, 'update')
      .mockResolvedValueOnce(<any>{ ...TEST_DEVICE, ...TEST_UPDATE_PROPERTY });

    const devices = await devicesService.update(
      TEST_CRITERIA,
      TEST_UPDATE_PROPERTY
    );

    expect(devices).toStrictEqual({ ...TEST_DEVICE, ...TEST_UPDATE_PROPERTY });

    expect(findDevicesFunc).toBeCalledTimes(1);
    expect(findDevicesFunc).toBeCalledWith(
      DeviceEntity,
      TEST_CRITERIA,
      TEST_UPDATE_PROPERTY
    );
  });
});