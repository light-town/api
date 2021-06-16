import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { IEntity } from './entity.interface';
import AccountEntity from './account.entity';
import TeamEntity from './team.entity';
import InvitationVerificationStageEntity from './invitation-verification-stage.entity';

@Entity('invitations')
export class InvitationEntity extends IEntity {
  @Column({ type: 'uuid', name: 'account_id' })
  public accountId: string;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({
    name: 'account_id',
    referencedColumnName: 'id',
  })
  public account?: AccountEntity;

  @Column({ type: 'uuid', name: 'team_id' })
  public teamId: string;

  @ManyToOne(() => TeamEntity)
  @JoinColumn({
    name: 'team_id',
    referencedColumnName: 'id',
  })
  public team?: TeamEntity;

  @Column({ type: 'uuid', name: 'team_verification_stage_id' })
  public teamVerificationStageId: string;

  @ManyToOne(() => InvitationVerificationStageEntity)
  @JoinColumn({
    name: 'team_verification_stage_id',
    referencedColumnName: 'id',
  })
  public teamVerificationStage?: InvitationVerificationStageEntity;

  @Column({ type: 'uuid', name: 'account_verification_stage_id' })
  public accountVerificationStageId: string;

  @ManyToOne(() => InvitationVerificationStageEntity)
  @JoinColumn({
    name: 'account_verification_stage_id',
    referencedColumnName: 'id',
  })
  public accountVerificationStage?: InvitationVerificationStageEntity;

  @Column({ name: 'expires_at' })
  public expiresAt: Date;

  @Column({ type: 'jsonb', name: 'payload', nullable: true })
  public payload?: Record<string, any>;
}

export default InvitationEntity;
