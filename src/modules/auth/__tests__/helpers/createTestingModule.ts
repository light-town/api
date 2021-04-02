import { Test } from '@nestjs/testing';
import { getConnectionToken, getRepositoryToken } from '@nestjs/typeorm';
import UserEntity from '~/db/entities/user.entity';
import { mockRepository } from '~/../__tests__/__mocks__/mockRepository';
import AccountEntity from '~/db/entities/account.entity';
import AuthModule from '~/modules/auth/auth.module';
import DeviceEntity from '~/db/entities/device.entity';
import SessionEntity from '~/db/entities/session.entity';
import MFATypeEntity from '~/db/entities/mfa-type.entity';
import VerifySessionStageEntity from '~/db/entities/session-verification-stage.entity';
import PushNotificationStageEntity from '~/db/entities/push-notification-stage.entity';
import PushNotificationEntity from '~/db/entities/push-notification.entity';
import VerificationDeviceEntity from '~/db/entities/verification-devices.entity';

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
    .overrideProvider(getRepositoryToken(VerificationDeviceEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(SessionEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(MFATypeEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(VerifySessionStageEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(PushNotificationEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(PushNotificationStageEntity))
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
