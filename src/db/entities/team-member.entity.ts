import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import AccountEntity from './account.entity';
import { IEntity } from './entity.interface';
import TeamEntity from './team.entity';

@Entity('team_members')
export class TeamMemberEntity extends IEntity {
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
}

export default TeamMemberEntity;
