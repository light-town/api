import faker from 'faker';
import { MFATypesEnum } from '~/modules/auth/auth.dto';
import MFATypeEntity from '../entities/mfa-type.entity';
import Factory from './factory';
import Seeder from './seeder';

export class MFATypesFactory implements Factory<MFATypeEntity> {
  public create({ name }: Partial<MFATypeEntity> = {}) {
    const mfaType = new MFATypeEntity();
    mfaType.name =
      name ||
      Object.values(MFATypesEnum)[
        faker.random.number({
          min: 0,
          max: Object.values(MFATypesEnum).length - 1,
        })
      ];
    return mfaType;
  }
}

export class MFATypesSeeder extends Seeder<MFATypeEntity>(MFATypeEntity) {
  public constructor(factory: MFATypesFactory) {
    super(factory);
  }
}

export default MFATypesSeeder;
