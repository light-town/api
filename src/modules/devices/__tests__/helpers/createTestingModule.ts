import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockRepository } from '~/../__tests__/__mocks__/mock-repository';
import DeviceEntity from '~/db/entities/device.entity';
import DevicesModule from '~/modules/devices/devices.module';
import initApp from '~/utils/init-app';
import VerificationDeviceEntity from '~/db/entities/verification-devices.entity';
import AccountEntity from '~/db/entities/account.entity';
import MFATypeEntity from '~/db/entities/mfa-type.entity';
import UserEntity from '~/db/entities/user.entity';

export const createTestingModule = async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [DevicesModule],
  })
    .overrideProvider(getRepositoryToken(DeviceEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(VerificationDeviceEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(AccountEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(MFATypeEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(UserEntity))
    .useFactory({ factory: mockRepository })
    .compile();

  const app = await initApp(moduleFixture.createNestApplication());
  await app.init();

  return app;
};

export default createTestingModule;
