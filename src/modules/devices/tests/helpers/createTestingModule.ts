import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockRepository } from '~/../test/__mocks__/mockRepository';
import DeviceEntity from '~/db/entities/device.entity';
import DevicesModule from '../../devices.module';
import initApp from '~/utils/init-app';

export const createTestingModule = async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [DevicesModule],
  })
    .overrideProvider(getRepositoryToken(DeviceEntity))
    .useFactory({ factory: mockRepository })
    .compile();

  const app = await initApp(moduleFixture.createNestApplication());
  await app.init();

  return app;
};

export default createTestingModule;
