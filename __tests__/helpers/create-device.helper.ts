import { INestApplication } from '@nestjs/common';
import DevicesController from '~/modules/devices/devices.controller';
import { OS } from '~/modules/devices/devices.dto';
import DevicesService from '~/modules/devices/devices.service';
import faker from 'faker';

export class CreateDeviceOptions {
  os: OS;
  model: string;
}

export const createDeviceHelper = async (
  app: INestApplication,
  options: CreateDeviceOptions
) => {
  const devicesController = app.get<DevicesController>(DevicesController);
  const devicesService = app.get<DevicesService>(DevicesService);

  const { deviceUuid } = await devicesController.createDevice(
    <any>{
      header: () => faker.internet.userAgent(),
      ip: `${faker.internet.ip()}:${faker.datatype.number({
        min: 1000,
        max: 9999,
      })}`,
    },
    {
      os: options.os,
      model: options.model,
    }
  );

  return await devicesService.findOne({ where: { id: deviceUuid } });
};

export default createDeviceHelper;
