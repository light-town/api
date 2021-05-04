import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { IEntity } from './entity.interface';
import VaultEntity from './vault.entity';
import KeySetEntity from './key-set.entity';

@Entity('key_set_vaults')
export class KeySetVaultEntity extends IEntity {
  @Column({ type: 'uuid', name: 'key_set_id' })
  public keySetId: string;

  @ManyToOne(() => KeySetEntity)
  @JoinColumn({
    name: 'key_set_id',
    referencedColumnName: 'id',
  })
  public keySet?: KeySetEntity;

  @Column({ type: 'uuid', name: 'vault_id' })
  public vaultId: string;

  @ManyToOne(() => VaultEntity)
  @JoinColumn({
    name: 'vault_id',
    referencedColumnName: 'id',
  })
  public vault?: VaultEntity;
}

export default KeySetEntity;
