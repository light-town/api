import PushNotificationStagesSeeder, {
  PushNotificationStagesFactory,
} from '~/db/seeds/push-notification-stages.seed';
import { PushNotificationStageEnum } from '~/modules/push-notifications/push-notifications.dto';

export const initDB = async () => {
  const pushNotificationStagesSeeder = new PushNotificationStagesSeeder(
    new PushNotificationStagesFactory()
  );
  await pushNotificationStagesSeeder.run(1, {
    name: PushNotificationStageEnum.CREATED,
  });
  await pushNotificationStagesSeeder.run(1, {
    name: PushNotificationStageEnum.SENT,
  });
  await pushNotificationStagesSeeder.run(1, {
    name: PushNotificationStageEnum.ARRIVED,
  });
};

export default initDB;
