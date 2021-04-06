import { MFATypesEnum } from '~/modules/auth/auth.dto';
import { MFATypesSeeder, MFATypesFactory } from '~/db/seeds/mfa-types.seed';
import VerifySessionStagesSeeder, {
  VerifySessionStagesFactory,
} from '~/db/seeds/verify-session-stages.seed';
import { SessionVerificationStageEnum } from '~/modules/sessions/sessions.dto';
import PushNotificationStagesSeeder, {
  PushNotificationStagesFactory,
} from '~/db/seeds/push-notification-stages.seed';
import { PushNotificationStageEnum } from '~/modules/push-notifications/push-notifications.dto';

export const initDatabaseHelper = async () => {
  const mfaTypesSeeder = new MFATypesSeeder(new MFATypesFactory());
  await mfaTypesSeeder.run(1, { name: MFATypesEnum.NONE });
  await mfaTypesSeeder.run(1, { name: MFATypesEnum.FINGERPRINT });
  await mfaTypesSeeder.run(1, { name: MFATypesEnum.ONE_TIME_PASSWORD });

  const verifySessionStagesSeeder = new VerifySessionStagesSeeder(
    new VerifySessionStagesFactory()
  );
  await verifySessionStagesSeeder.run(1, {
    name: SessionVerificationStageEnum.REQUIRED,
  });
  await verifySessionStagesSeeder.run(1, {
    name: SessionVerificationStageEnum.COMPLETED,
  });
  await verifySessionStagesSeeder.run(1, {
    name: SessionVerificationStageEnum.NOT_REQUIRED,
  });

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

export default initDatabaseHelper;
