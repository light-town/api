import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import VaultItemEntity from '~/db/entities/vault-item.entity';
import AccountsService from '../accounts/accounts.service';
import VaultFoldersService from '../vault-folders/vault-folders.service';
import VaultItemCategoriesService from '../vault-item-categories/vault-item-categories.service';
import VaultsService from '../vaults/vaults.service';
import { VaultItem } from './vault-items.dto';

export class CreateVaultItemPayload {
  encOverview: Record<string, any>;
  encDetails?: Record<string, any>;
  categoryId: string;
}

export class FindVaultItemOptions {
  id?: string;
  vaultId?: string;
  folderId?: string;
  root?: boolean;
}

@Injectable()
export class VaultItemsService {
  public constructor(
    @InjectRepository(VaultItemEntity)
    private readonly vaultItemsRepository: Repository<VaultItemEntity>,
    @Inject(forwardRef(() => VaultsService))
    private readonly vaultsService: VaultsService,
    private readonly accountsService: AccountsService,
    @Inject(forwardRef(() => VaultFoldersService))
    private readonly vaultFoldersService: VaultFoldersService,
    @Inject(forwardRef(() => VaultItemCategoriesService))
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

    if (!category)
      throw new ApiNotFoundException('The vault item category was not found');

    return this.vaultItemsRepository.save(
      this.vaultItemsRepository.create({
        encOverview: payload.encOverview,
        encDetails: payload.encDetails,
        vaultId: vault.id,
        folderId: folder?.id,
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

  public getVaultItemsCount(
    options: FindVaultItemOptions,
    onlyOverview = false
  ): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options, onlyOverview);

    return query.getCount();
  }

  public getVaultItems(
    options: FindVaultItemOptions,
    onlyOverview = false
  ): Promise<VaultItemEntity[]> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options, onlyOverview);

    return query.getRawMany();
  }

  public getVaultItem(
    options: FindVaultItemOptions,
    onlyOverview = false
  ): Promise<VaultItemEntity> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options, onlyOverview);

    return query.getRawOne();
  }

  public prepareQuery(
    options: FindVaultItemOptions,
    onlyOverview = false
  ): [string, SelectQueryBuilder<VaultItemEntity>] {
    const alias = 'vault_items';
    const q = this.vaultItemsRepository
      .createQueryBuilder(alias)
      .select(`${alias}.id`, 'id')
      .addSelect(`${alias}.encOverview`, 'encOverview')
      .addSelect(`${alias}.vaultId`, 'vaultId')
      .addSelect(`${alias}.folderId`, 'folderId')
      .addSelect(`${alias}.categoryId`, 'categoryId')
      .addSelect(`${alias}.creatorAccountId`, 'creatorAccountId')
      .addSelect(`${alias}.updatedAt`, 'updatedAt')
      .addSelect(`${alias}.createdAt`, 'createdAt')
      .andWhere(`${alias}.isDeleted = :isDeleted`, { isDeleted: false });

    if (!onlyOverview) q.addSelect(`${alias}.encDetails`, 'encDetails');

    if (options.hasOwnProperty('id')) q.andWhere(`${alias}.id = :id`, options);

    if (options.hasOwnProperty('vaultId'))
      q.andWhere(`${alias}.vaultId = :vaultId`, options);

    if (options.hasOwnProperty('folderId'))
      q.andWhere(`${alias}.folderId = :folderId`, options);

    if (options.hasOwnProperty('root')) q.andWhere(`${alias}.folderId IS NULL`);

    return [alias, q];
  }
}

export default VaultItemsService;
