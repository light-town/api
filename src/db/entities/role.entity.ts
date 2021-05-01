import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { IEntity } from './entity.interface';
import TeamEntity from './team.entity';

@Entity('roles')
export class RoleEntity extends IEntity {
  @Column({ length: 256 })
  public name: string;

  @Column({ type: 'uuid', name: 'parent_role_id', nullable: true })
  public parentRoleId?: string;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({
    name: 'parent_role_id',
    referencedColumnName: 'id',
  })
  public parentRole?: RoleEntity;

  @Column({ type: 'uuid', name: 'team_id' })
  public teamId?: string;

  @ManyToOne(() => TeamEntity)
  @JoinColumn({
    name: 'team_id',
    referencedColumnName: 'id',
  })
  public team?: TeamEntity;
}

export default RoleEntity;
