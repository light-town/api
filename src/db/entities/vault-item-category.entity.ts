import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import AccountEntity from './account.entity';
import VaultEntity from './vault.entity';
import { IEntity } from './entity.interface';

@Entity('vault_item_categories')
export class VaultItemCategoryEntity extends IEntity {
  @Column({ type: 'jsonb', name: 'enc_overview' })
  encOverview: Record<string, any>;

  @Column({ type: 'jsonb', name: 'enc_details' })
  encDetails: Record<string, any>;

  @Column({ type: 'uuid', name: 'vault_id' })
  public vaultId: string;

  @ManyToOne(() => VaultEntity)
  @JoinColumn({
    name: 'vault_id',
    referencedColumnName: 'id',
  })
  public vault?: VaultEntity;

  @Column({ type: 'uuid', name: 'creator_account_id' })
  public creatorAccountId: string;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({
    name: 'creator_account_id',
    referencedColumnName: 'id',
  })
  public creatorAccount?: AccountEntity;
}

export default VaultItemCategoryEntity;
