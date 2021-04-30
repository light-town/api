import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import AccountEntity from './account.entity';
import { IEntity } from './entity.interface';
import TeamMemberEntity from './team-member.entity';

@Entity('teams')
export class TeamEntity extends IEntity {
  @Column({ type: 'jsonb', name: 'enc_key' })
  encKey: Record<string, any>;

  @Column({ type: 'jsonb', name: 'enc_overview' })
  encOverview: Record<string, any>;

  @Column({ type: 'uuid', name: 'creator_account_id' })
  public creatorAccountId: string;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({
    name: 'creator_account_id',
    referencedColumnName: 'id',
  })
  public creatorAccount?: AccountEntity;

  @OneToMany(() => TeamMemberEntity, teamMember => teamMember.team)
  public members?: TeamMemberEntity[];
}

export default TeamEntity;
