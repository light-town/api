import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { IEntity } from './entity.interface';
import AccountEntity from './account.entity';
import VaultEntity from './vault.entity';
import VaultFolderEntity from './vault-folder.entity';
import VaultItemCategoryEntity from './vault-item-category.entity';

@Entity('vault_items')
export class VaultItemEntity extends IEntity {
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

  @Column({ type: 'uuid', name: 'folder_id', nullable: true })
  public folderId: string;

  @ManyToOne(() => VaultFolderEntity)
  @JoinColumn({
    name: 'folder_id',
    referencedColumnName: 'id',
  })
  public folder?: VaultFolderEntity;

  @Column({ type: 'uuid', name: 'category_id' })
  public categoryId: string;

  @ManyToOne(() => VaultItemCategoryEntity)
  @JoinColumn({
    name: 'category_id',
    referencedColumnName: 'id',
  })
  public category?: VaultItemCategoryEntity;
}

export default VaultItemEntity;
