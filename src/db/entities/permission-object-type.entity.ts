import { Column, Entity } from 'typeorm';
import { ObjectTypesEnum } from '~/modules/roles/roles.dto';
import { IEntity } from './entity.interface';

@Entity('permission_object_types')
export class PermissionObjectTypeEntity extends IEntity {
  @Column({ length: 256, unique: true })
  public name: ObjectTypesEnum;
}

export default PermissionObjectTypeEntity;
