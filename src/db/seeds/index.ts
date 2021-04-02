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
import AccountsSeeder, { AccountsFactory } from './accounts.seed';

dotenv.config();

createConnection().then(async (connection: Connection) => {
  await connection.synchronize(true);

  const userSeeder = new UsersSeeder(new UsersFactory());
  const users = await userSeeder.run(10);

  console.log(users);

  const mfaTypesSeeder = new MFATypesSeeder(new MFATypesFactory());
  const noneMFAType = await mfaTypesSeeder.run(1, { name: MFATypesEnum.NONE });
  console.log(noneMFAType);

  const fingerprintMFAType = await mfaTypesSeeder.run(1, {
    name: MFATypesEnum.FINGERPRINT,
  });
  console.log(fingerprintMFAType);

  const optMFAType = await mfaTypesSeeder.run(1, {
    name: MFATypesEnum.ONE_TIME_PASSWORD,
  });
  console.log(optMFAType);

  const verifySessionStagesSeeder = new VerifySessionStagesSeeder(
    new VerifySessionStagesFactory()
  );
  console.log(
    await verifySessionStagesSeeder.run(1, {
      name: SessionVerificationStageEnum.REQUIRED,
    })
  );

  console.log(
    await verifySessionStagesSeeder.run(1, {
      name: SessionVerificationStageEnum.COMPLETED,
    })
  );

  console.log(
    await verifySessionStagesSeeder.run(1, {
      name: SessionVerificationStageEnum.NOT_REQUIRED,
    })
  );

  const pushNotificationStagesSeeder = new PushNotificationStagesSeeder(
    new PushNotificationStagesFactory()
  );
  console.log(
    await pushNotificationStagesSeeder.run(1, {
      name: PushNotificationStageEnum.CREATED,
    })
  );
  console.log(
    await pushNotificationStagesSeeder.run(1, {
      name: PushNotificationStageEnum.SENT,
    })
  );
  console.log(
    await pushNotificationStagesSeeder.run(1, {
      name: PushNotificationStageEnum.ARRIVED,
    })
  );

  const accountsSeeder = new AccountsSeeder(new AccountsFactory());
  console.log(
    await accountsSeeder.run(1, {
      userId: users[0].id,
      mfaTypeId: noneMFAType[0].id,
      password: '123',
    })
  );
  console.log(
    await accountsSeeder.run(1, {
      userId: users[0].id,
      mfaTypeId: fingerprintMFAType[0].id,
      password: '123',
    })
  );
  console.log(
    await accountsSeeder.run(1, {
      userId: users[0].id,
      mfaTypeId: optMFAType[0].id,
      password: '123',
    })
  );
});
