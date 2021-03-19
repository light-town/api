import { createConnection, Connection } from 'typeorm';
import * as dotenv from 'dotenv';
import { UsersSeeder, UsersFactory } from './users.seed';
import { MFATypesSeeder, MFATypesFactory } from './mfa-types.seed';
import { MFATypesEnum } from '~/modules/auth/auth.dto';
import VerifySessionStagesSeeder, {
  VerifySessionStagesFactory,
} from './verify-session-stages.seed';
import { VerifySessionStageEnum } from '~/modules/sessions/sessions.dto';

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
    name: VerifySessionStageEnum.IN_PROGRESS,
  });
  await verifySessionStagesSeeder.run(1, {
    name: VerifySessionStageEnum.COMPLETED,
  });
  await verifySessionStagesSeeder.run(1, {
    name: VerifySessionStageEnum.NOT_REQUIRED,
  });
});
