import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { IEntity } from './entity.interface';
import ObjectTypeEntity from './permission-object-type.entity';
import PermissionTypeEntity from './permission-type.entity';
import RoleEntity from './role.entity';

@Entity('permissions')
export class PermissionEntity extends IEntity {
  @Column({ type: 'uuid', name: 'object_id' })
  public objectId: string;

  @Column({ type: 'uuid', name: 'type_id' })
  public typeId: string;

  @ManyToOne(() => PermissionTypeEntity)
  @JoinColumn({
    name: 'type_id',
    referencedColumnName: 'id',
  })
  public type?: PermissionTypeEntity;

  @Column({ type: 'uuid', name: 'object_type_id' })
  public objectTypeId: string;

  @ManyToOne(() => ObjectTypeEntity)
  @JoinColumn({
    name: 'object_type_id',
    referencedColumnName: 'id',
  })
  public objectType?: ObjectTypeEntity;

  @Column({ type: 'uuid', name: 'role_id' })
  public roleId: string;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({
    name: 'role_id',
    referencedColumnName: 'id',
  })
  public role?: RoleEntity;
}

export default PermissionEntity;
