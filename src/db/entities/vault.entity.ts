import { Column, Entity } from 'typeorm';
import { IEntity } from './entity.interface';

@Entity('vaults')
export class VaultEntity extends IEntity {
  @Column({ type: 'jsonb', name: 'enc_key' })
  encKey: Record<string, any>;

  @Column({ type: 'jsonb', name: 'enc_overview' })
  encOverview: Record<string, any>;
}

export default VaultEntity;
