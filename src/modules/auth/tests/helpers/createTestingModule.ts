import { Test } from '@nestjs/testing';
import { getConnectionToken, getRepositoryToken } from '@nestjs/typeorm';
import UserEntity from '~/db/entities/user.entity';
import { mockRepository } from '~/../test/__mocks__/mockRepository';
import AccountEntity from '~/db/entities/account.entity';
import AuthModule from '~/modules/auth/auth.module';
import DeviceEntity from '~/db/entities/device.entity';
import SessionEntity from '~/db/entities/session.entity';
import MFATypeEntity from '~/db/entities/mfa-type.entity';

export const createTestingModule = () =>
  Test.createTestingModule({
    imports: [AuthModule],
  })
    .overrideProvider(getRepositoryToken(UserEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(AccountEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(DeviceEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(SessionEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(MFATypeEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getConnectionToken())
    .useFactory({
      factory: jest.fn(() => ({
        manager: jest.fn(),
        transaction: jest.fn(),
      })),
    })
    .compile();

export default createTestingModule;
