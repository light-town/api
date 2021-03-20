import * as faker from 'faker';
import { PushNotificationStageEnum } from '~/modules/push-notifications/push-notifications.dto';
import PushNotificationStageEntity from '../entities/push-notification-stage.entity';
import Factory from './factory';
import Seeder from './seeder';

export class PushNotificationStagesFactory
  implements Factory<PushNotificationStageEntity> {
  public create({ name }: Partial<PushNotificationStageEntity> = {}) {
    const pushNotificationStage = new PushNotificationStageEntity();
    pushNotificationStage.name =
      name ||
      Object.values(PushNotificationStageEnum)[
        faker.random.number({
          min: 0,
          max: Object.values(PushNotificationStageEnum).length - 1,
        })
      ];
    return pushNotificationStage;
  }
}

export class PushNotificationStagesSeeder extends Seeder<PushNotificationStageEntity>(
  PushNotificationStageEntity
) {
  public constructor(factory: PushNotificationStagesFactory) {
    super(factory);
  }
}

export default PushNotificationStagesSeeder;
