import { createConnection, Connection } from 'typeorm';
import * as dotenv from 'dotenv';
import { UsersSeeder, UsersFactory } from './users.seed';
import { MFATypesSeeder, MFATypesFactory } from './mfa-types.seed';
import { MFATypesEnum } from '~/modules/auth/auth.dto';
import VerifySessionStagesSeeder, {
  VerifySessionStagesFactory,
} from './verify-session-stages.seed';
import { SessionVerificationStageEnum } from '~/modules/sessions/sessions.dto';
import PushNotificationStagesSeeder, {
  PushNotificationStagesFactory,
} from './push-notification-stages.seed';
import { PushNotificationStageEnum } from '~/modules/push-notifications/push-notifications.dto';
import PermissionObjectTypesSeeder, {
  PermissionObjectTypesFactory,
} from '~/db/seeds/permission-types.seed';
import { ObjectTypesEnum } from '~/modules/roles/roles.dto';
import PermissionTypesSeeder, {
  PermissionTypesFactory,
} from '~/db/seeds/permission-object-types.seed';
import { PermissionTypesEnum } from '~/modules/permissions/permissions.dto';

dotenv.config();

createConnection().then(async (connection: Connection) => {
  await connection.synchronize(true);

  const userSeeder = new UsersSeeder(new UsersFactory());
  const users = await userSeeder.run(10);
  console.log(users);

  const mfaTypesSeeder = new MFATypesSeeder(new MFATypesFactory());
  console.log(
    await Promise.all([
      mfaTypesSeeder.run(1, { name: MFATypesEnum.NONE }),
      mfaTypesSeeder.run(1, { name: MFATypesEnum.ONE_TIME_PASSWORD }),
      mfaTypesSeeder.run(1, { name: MFATypesEnum.FINGERPRINT }),
    ])
  );

  const verifySessionStagesSeeder = new VerifySessionStagesSeeder(
    new VerifySessionStagesFactory()
  );
  console.log(
    await Promise.all([
      verifySessionStagesSeeder.run(1, {
        name: SessionVerificationStageEnum.NOT_REQUIRED,
      }),
      verifySessionStagesSeeder.run(1, {
        name: SessionVerificationStageEnum.REQUIRED,
      }),
      verifySessionStagesSeeder.run(1, {
        name: SessionVerificationStageEnum.COMPLETED,
      }),
    ])
  );

  const pushNotificationStagesSeeder = new PushNotificationStagesSeeder(
    new PushNotificationStagesFactory()
  );
  console.log(
    await Promise.all([
      pushNotificationStagesSeeder.run(1, {
        name: PushNotificationStageEnum.CREATED,
      }),
      pushNotificationStagesSeeder.run(1, {
        name: PushNotificationStageEnum.SENT,
      }),
      pushNotificationStagesSeeder.run(1, {
        name: PushNotificationStageEnum.ARRIVED,
      }),
    ])
  );

  const permissionObjectTypesSeeder = new PermissionObjectTypesSeeder(
    new PermissionObjectTypesFactory()
  );
  await Promise.all([
    permissionObjectTypesSeeder.run(1, { name: ObjectTypesEnum.TEAM }),
    permissionObjectTypesSeeder.run(1, { name: ObjectTypesEnum.VAULT }),
    permissionObjectTypesSeeder.run(1, { name: ObjectTypesEnum.FOLDER }),
    permissionObjectTypesSeeder.run(1, { name: ObjectTypesEnum.ITEM }),
  ]);

  const permissionTypesSeeder = new PermissionTypesSeeder(
    new PermissionTypesFactory()
  );
  await Promise.all([
    permissionTypesSeeder.run(1, {
      name: PermissionTypesEnum.READ_ONLY,
      level: 0.2,
    }),
    permissionTypesSeeder.run(1, {
      name: PermissionTypesEnum.READ_AND_WRITE,
      level: 0.4,
    }),
    permissionTypesSeeder.run(1, {
      name: PermissionTypesEnum.DETELE,
      level: 0.6,
    }),
    permissionTypesSeeder.run(1, {
      name: PermissionTypesEnum.ADMINISTRATOR,
      level: 0.8,
    }),
    permissionTypesSeeder.run(1, {
      name: PermissionTypesEnum.CREATOR,
      level: 1,
    }),
  ]);
});
