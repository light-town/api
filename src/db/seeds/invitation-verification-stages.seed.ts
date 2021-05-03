import faker from 'faker';
import { InvitationVerificationStagesEnum } from '~/modules/invitations/invitations.dto';
import InvitationVerificationStageEntity from '../entities/invitation-verification-stage.entity';
import Factory from './factory';
import Seeder from './seeder';

export class InvitationVerificationStagesFactory
  implements Factory<InvitationVerificationStageEntity> {
  public create({ name }: Partial<InvitationVerificationStageEntity> = {}) {
    const stage = new InvitationVerificationStageEntity();
    stage.name =
      name ||
      Object.values(InvitationVerificationStagesEnum)[
        faker.datatype.number({
          min: 0,
          max: Object.values(InvitationVerificationStagesEnum).length - 1,
        })
      ];
    return stage;
  }
}

export class InvitationVerificationStagesSeeder extends Seeder<InvitationVerificationStageEntity>(
  InvitationVerificationStageEntity
) {
  public constructor(factory: InvitationVerificationStagesFactory) {
    super(factory);
  }
}

export default InvitationVerificationStagesSeeder;
