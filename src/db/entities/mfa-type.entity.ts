import { Column, Entity } from 'typeorm';
import { MFATypesEnum } from '~/modules/auth/auth.dto';
import { IEntity } from './entity.interface';

@Entity('mfa_types')
export class MFATypeEntity extends IEntity {
  @Column({ length: 256, unique: true })
  public name: MFATypesEnum;
}

export default MFATypeEntity;
