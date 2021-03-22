import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockRepository } from '~/../test/__mocks__/mockRepository';
import DeviceEntity from '~/db/entities/device.entity';
import PushNotificationStageEntity from '~/db/entities/push-notification-stage.entity';
import PushNotificationEntity from '~/db/entities/push-notification.entity';
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
    .compile();

export default createTestingModule;
