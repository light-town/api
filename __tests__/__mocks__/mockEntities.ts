import { getConnectionToken, getRepositoryToken } from '@nestjs/typeorm';
import mockRepository from './mockRepository';
import UserEntity from '~/db/entities/user.entity';
import AccountEntity from '~/db/entities/account.entity';
import DeviceEntity from '~/db/entities/device.entity';
import SessionEntity from '~/db/entities/session.entity';
import MFATypeEntity from '~/db/entities/mfa-type.entity';
import SessionVerificationStageEntity from '~/db/entities/session-verification-stage.entity';
import PushNotificationStageEntity from '~/db/entities/push-notification-stage.entity';
import PushNotificationEntity from '~/db/entities/push-notification.entity';
import VerificationDeviceEntity from '~/db/entities/verification-devices.entity';
import KeySetEntity from '~/db/entities/key-sets.entity';
import VaultEntity from '~/db/entities/vault.entity';
import { TestingModuleBuilder } from '@nestjs/testing';

export default (app: TestingModuleBuilder) => {
  return app
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
    .overrideProvider(getRepositoryToken(SessionVerificationStageEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(PushNotificationEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(PushNotificationStageEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(KeySetEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(VaultEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getConnectionToken())
    .useFactory({
      factory: jest.fn(() => ({
        manager: jest.fn(),
        transaction: jest.fn(),
      })),
    });
};
