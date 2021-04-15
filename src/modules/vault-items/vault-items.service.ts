import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import VaultItemEntity from '~/db/entities/vault-item.entity';
import AccountsService from '../accounts/accounts.service';
import VaultFoldersService from '../vault-folders/vault-folders.service';
import VaultItemCategoriesService from '../vault-item-categories/vault-item-categories.service';
import VaultsService from '../vaults/vaults.service';
import { VaultItem } from './vault-items.dto';

export class CreateVaultItemPayload {
  encOverview: Record<string, any>;
  encDetails: Record<string, any>;
  categoryId: string;
}

export class FindVaultItemOptions {
  id?: string;
  vaultId?: string;
  folderId?: string;
}

@Injectable()
export class VaultItemsService {
  public constructor(
    @InjectRepository(VaultItemEntity)
    private readonly vaultItemsRepository: Repository<VaultItemEntity>,
    private readonly vaultsService: VaultsService,
    private readonly accountsService: AccountsService,
    private readonly vaultFoldersService: VaultFoldersService,
    private readonly vaultItemCategoriesService: VaultItemCategoriesService
  ) {}

  public async create(
    accountId: string,
    vaultId: string,
    folderId: string,
    payload: CreateVaultItemPayload
  ) {
    const [account, vault, folder, category] = await Promise.all([
      this.accountsService.getAccount({ id: accountId }),
      this.vaultsService.getVault({ id: vaultId }),
      this.vaultFoldersService.getVaultFolder({ id: folderId }),
      this.vaultItemCategoriesService.getVaultItemCategory({
        id: payload.categoryId,
      }),
    ]);

    if (!account) throw new ApiNotFoundException('The account was not found');

    if (!vault) throw new ApiNotFoundException('The vault was not found');

    if (!folder)
      throw new ApiNotFoundException('The vault folder was not found');

    if (!category)
      throw new ApiNotFoundException('The vault item category was not found');

    return this.vaultItemsRepository.save(
      this.vaultItemsRepository.create({
        encOverview: payload.encOverview,
        encDetails: payload.encDetails,
        vaultId: vault.id,
        folderId: folder.id,
        categoryId: category.id,
        creatorAccountId: account.id,
      })
    );
  }

  public format(vaultItem: VaultItemEntity): VaultItem {
    return this.normalize(vaultItem);
  }

  public formatAll(vaultItems: VaultItemEntity[]): VaultItem[] {
    return vaultItems.map(item => this.normalize(item));
  }

  public normalize(vaultItem: VaultItemEntity): VaultItem {
    return {
      uuid: vaultItem?.id,
      encOverview: vaultItem?.encOverview,
      encDetails: vaultItem?.encDetails,
      vaultUuid: vaultItem?.vaultId,
      folderUuid: vaultItem?.folderId,
      categoryUuid: vaultItem?.categoryId,
      creatorAccountUuid: vaultItem?.creatorAccountId,
      lastUpdatedAt: vaultItem?.updatedAt.toISOString(),
      createdAt: vaultItem?.createdAt.toISOString(),
    };
  }

  public find(
    options: FindManyOptions<VaultItemEntity>
  ): Promise<VaultItemEntity[]> {
    return this.vaultItemsRepository.find(options);
  }

  public findOne(
    options: FindOneOptions<VaultItemEntity>
  ): Promise<VaultItemEntity> {
    return this.vaultItemsRepository.findOne(options);
  }

  public getVaultItems(
    options: FindVaultItemOptions,
    onlyOverview: boolean
  ): Promise<VaultItemEntity[]> {
    const select: (keyof VaultItemEntity)[] = [
      'id',
      'encOverview',
      'encDetails',
      'vaultId',
      'folderId',
      'categoryId',
      'creatorAccountId',
      'updatedAt',
      'createdAt',
    ];

    if (onlyOverview) select.splice(select.indexOf('encDetails'), 1);

    return this.find({
      select,
      where: {
        ...options,
        isDeleted: false,
      },
    });
  }

  public async getVaultItem(
    options: FindVaultItemOptions,
    onlyOverview = false
  ): Promise<VaultItemEntity> {
    const select: (keyof VaultItemEntity)[] = [
      'id',
      'encOverview',
      'encDetails',
      'vaultId',
      'folderId',
      'categoryId',
      'creatorAccountId',
      'updatedAt',
      'createdAt',
    ];

    if (onlyOverview) select.splice(select.indexOf('encDetails'), 1);

    return this.findOne({
      select,
      where: {
        ...options,
        isDeleted: false,
      },
    });
  }
}

export default VaultItemsService;
