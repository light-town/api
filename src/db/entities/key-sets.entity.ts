import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { IEntity } from './entity.interface';
import AccountEntity from './account.entity';
import VaultEntity from './vault.entity';

@Entity('key_sets')
export class KeySetEntity extends IEntity {
  @Column({ name: 'public_key' })
  public publicKey: string;

  @Column({ type: 'jsonb', name: 'enc_private_key' })
  public encPrivateKey: Record<string, any>;

  @Column({ type: 'jsonb', name: 'enc_symmetric_key' })
  public encSymmetricKey: Record<string, any>;

  @Column({ default: false })
  public isPrimary: boolean;

  @Column({ type: 'uuid', name: 'account_id' })
  public accountId: string;

  @Column({ type: 'uuid', name: 'vault_id' })
  public vaultId: string;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({
    name: 'account_id',
    referencedColumnName: 'id',
  })
  public account?: AccountEntity;

  @ManyToOne(() => VaultEntity)
  @JoinColumn({
    name: 'vault_id',
    referencedColumnName: 'id',
  })
  public vault?: VaultEntity;
}

export default KeySetEntity;
