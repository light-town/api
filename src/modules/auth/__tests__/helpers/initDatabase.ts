import { MFATypesEnum } from '~/modules/auth/auth.dto';
import { MFATypesSeeder, MFATypesFactory } from '~/db/seeds/mfa-types.seed';
import VerifySessionStagesSeeder, {
  VerifySessionStagesFactory,
} from '~/db/seeds/verify-session-stages.seed';
import { SessionVerificationStageEnum } from '~/modules/sessions/sessions.dto';

export const initDB = async () => {
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
};

export default initDB;
