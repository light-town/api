import { Column, Entity } from 'typeorm';
import { InvitationVerificationStagesEnum } from '~/modules/invitations/invitations.dto';
import { IEntity } from './entity.interface';

@Entity('invitation_verification_stages')
export class InvitationVerificationStageEntity extends IEntity {
  @Column({ length: 256, unique: true })
  public name: InvitationVerificationStagesEnum;
}

export default InvitationVerificationStageEntity;
