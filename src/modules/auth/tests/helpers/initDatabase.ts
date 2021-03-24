import { MFATypesEnum } from '~/modules/auth/auth.dto';
import { MFATypesSeeder, MFATypesFactory } from '~/db/seeds/mfa-types.seed';
import VerifySessionStagesSeeder, {
  VerifySessionStagesFactory,
} from '~/db/seeds/verify-session-stages.seed';
import { VerifySessionStageEnum } from '~/modules/sessions/sessions.dto';

export const initDB = async () => {
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
};

export default initDB;
