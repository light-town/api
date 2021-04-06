import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockRepository } from '~/../__tests__/__mocks__/mock-repository';
import AccountEntity from '~/db/entities/account.entity';
import DeviceEntity from '~/db/entities/device.entity';
import MFATypeEntity from '~/db/entities/mfa-type.entity';
import PushNotificationStageEntity from '~/db/entities/push-notification-stage.entity';
import PushNotificationEntity from '~/db/entities/push-notification.entity';
import UserEntity from '~/db/entities/user.entity';
import VerificationDeviceEntity from '~/db/entities/verification-devices.entity';
import PushNotificationsModule from '../../push-notifications.module';

export const createTestingModule = () =>
  Test.createTestingModule({
    imports: [PushNotificationsModule],
  })
    .overrideProvider(getRepositoryToken(PushNotificationEntity))
    .useFactory({ factory: mockRepository })
    .overrideProvider(getRepositoryToken(PushNotificationStageEntity))
    .useFactory({ factory: mockRepository })
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

export default createTestingModule;
