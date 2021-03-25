import { createConnection, Connection } from 'typeorm';
import * as dotenv from 'dotenv';
import { UsersSeeder, UsersFactory } from './users.seed';
import { MFATypesSeeder, MFATypesFactory } from './mfa-types.seed';
import { MFATypesEnum } from '~/modules/auth/auth.dto';
import VerifySessionStagesSeeder, {
  VerifySessionStagesFactory,
} from './verify-session-stages.seed';
import { VerifySessionStageEnum } from '~/modules/sessions/sessions.dto';
import PushNotificationStagesSeeder, {
  PushNotificationStagesFactory,
} from './push-notification-stages.seed';
import { PushNotificationStageEnum } from '~/modules/push-notifications/push-notifications.dto';

dotenv.config();

createConnection().then(async (connection: Connection) => {
  await connection.synchronize(true);

  const userSeeder = new UsersSeeder(new UsersFactory());
  await userSeeder.run(10);

  const mfaTypesSeeder = new MFATypesSeeder(new MFATypesFactory());
  await mfaTypesSeeder.run(1, { name: MFATypesEnum.NONE });
  await mfaTypesSeeder.run(1, { name: MFATypesEnum.FINGERPRINT });
  await mfaTypesSeeder.run(1, { name: MFATypesEnum.ONE_TIME_PASSWORD });

  const verifySessionStagesSeeder = new VerifySessionStagesSeeder(
    new VerifySessionStagesFactory()
  );
  await verifySessionStagesSeeder.run(1, {
    name: VerifySessionStageEnum.REQUIRED,
  });
  await verifySessionStagesSeeder.run(1, {
    name: VerifySessionStageEnum.COMPLETED,
  });
  await verifySessionStagesSeeder.run(1, {
    name: VerifySessionStageEnum.NOT_REQUIRED,
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
});
