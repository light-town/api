import { Column, Entity } from 'typeorm';
import { IEntity } from './entity.interface';

@Entity('vaults')
export class VaultEntity extends IEntity {
  @Column({ type: 'jsonb', name: 'enc_key' })
  public encKey: Record<string, any>;
}

export default VaultEntity;
