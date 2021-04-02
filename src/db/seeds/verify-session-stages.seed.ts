import * as faker from 'faker';
import { SessionVerificationStageEnum } from '~/modules/sessions/sessions.dto';
import VerifySessionStageEntity from '../entities/session-verification-stage.entity';
import Factory from './factory';
import Seeder from './seeder';

export class VerifySessionStagesFactory
  implements Factory<VerifySessionStageEntity> {
  public create({ name }: Partial<VerifySessionStageEntity> = {}) {
    const verifySessionStage = new VerifySessionStageEntity();
    verifySessionStage.name =
      name ||
      Object.values(SessionVerificationStageEnum)[
        faker.random.number({
          min: 0,
          max: Object.values(SessionVerificationStageEnum).length - 1,
        })
      ];
    return verifySessionStage;
  }
}

export class VerifySessionStagesSeeder extends Seeder<VerifySessionStageEntity>(
  VerifySessionStageEntity
) {
  public constructor(factory: VerifySessionStagesFactory) {
    super(factory);
  }
}

export default VerifySessionStagesSeeder;
