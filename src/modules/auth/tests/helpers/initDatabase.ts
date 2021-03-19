import { MFATypesEnum } from '~/modules/auth/auth.dto';
import { MFATypesSeeder, MFATypesFactory } from '~/db/seeds/mfa-types.seed';

export const initDB = async () => {
  const mfaTypesSeeder = new MFATypesSeeder(new MFATypesFactory());
  await mfaTypesSeeder.run(1, { name: MFATypesEnum.NONE });
  await mfaTypesSeeder.run(1, { name: MFATypesEnum.FINGERPRINT });
  await mfaTypesSeeder.run(1, { name: MFATypesEnum.ONE_TIME_PASSWORD });
};

export default initDB;
