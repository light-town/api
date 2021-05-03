import { Column, Entity } from 'typeorm';
import { PermissionTypesEnum } from '~/modules/permissions/permissions.dto';
import { IEntity } from './entity.interface';

@Entity('permission_types')
export class PermissionTypeEntity extends IEntity {
  @Column({ length: 256, unique: true })
  public name: PermissionTypesEnum;

  @Column({ type: 'real', unique: true })
  public level: number;
}

export default PermissionTypeEntity;
