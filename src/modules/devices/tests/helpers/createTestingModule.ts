import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockRepository } from '~/../test/__mocks__/mockRepository';
import DeviceEntity from '~/db/entities/device.entity';
import DevicesModule from '../../devices.module';

export const createTestingModule = () =>
  Test.createTestingModule({
    imports: [DevicesModule],
  })
    .overrideProvider(getRepositoryToken(DeviceEntity))
    .useFactory({ factory: mockRepository })
    .compile();

export default createTestingModule;
