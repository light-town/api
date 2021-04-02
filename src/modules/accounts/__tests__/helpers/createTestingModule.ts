import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import UserEntity from '~/db/entities/user.entity';
import { mockRepository } from '~/../__tests__/__mocks__/mockRepository';
import AccountsModule from '~/modules/accounts/accounts.module';
import AccountEntity from '~/db/entities/account.entity';
import MFATypeEntity from '~/db/entities/mfa-type.entity';
import initApp from '~/utils/init-app';
import DeviceEntity from '~/db/entities/device.entity';
import VerificationDeviceEntity from '~/db/entities/verification-devices.entity';

export const createTestingModule = async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [AccountsModule],
  })
    .overrideProvider(getRepositoryToken(UserEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(AccountEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(MFATypeEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(DeviceEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(VerificationDeviceEntity))
    .useFactory({ factory: mockRepository })
    .compile();

  const app = initApp(moduleFixture.createNestApplication());
  await app.init();

  return app;
};

export default createTestingModule;
