import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { IEntity } from './entity.interface';
import AccountEntity from './account.entity';
import RoleEntity from './role.entity';
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

  @Column({ type: 'uuid', name: 'role_id' })
  public roleId: string;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({
    name: 'role_id',
    referencedColumnName: 'id',
  })
  public role?: RoleEntity;
}

export default TeamMemberEntity;
