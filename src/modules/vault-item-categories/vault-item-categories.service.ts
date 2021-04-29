import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import VaultItemCategoryEntity from '~/db/entities/vault-item-category.entity';
import AccountsService from '../accounts/accounts.service';
import VaultsService from '../vaults/vaults.service';
import {
  CreateVaultItemCategoryOptions,
  VaultItemCategory,
} from './vault-item-categories.dto';

export class FindVaultItemCategoriesOptions {
  id?: string;
  vaultId?: string;
}

@Injectable()
export class VaultItemCategoriesService {
  public constructor(
    @InjectRepository(VaultItemCategoryEntity)
    private readonly vaultItemCategoriesRepository: Repository<VaultItemCategoryEntity>,
    @Inject(forwardRef(() => VaultsService))
    private readonly vaultsService: VaultsService,
    private readonly accountsService: AccountsService
  ) {}

  public async createVaultItemCategory(
    accountId: string,
    vaultId: string,
    options: CreateVaultItemCategoryOptions
  ): Promise<VaultItemCategoryEntity> {
    const [account, vault] = await Promise.all([
      this.accountsService.getAccount({ id: accountId }),
      this.vaultsService.getVault({ id: vaultId }),
    ]);

    if (!account) throw new ApiNotFoundException('The account was not found');

    if (!vault) throw new ApiNotFoundException('The vault was not found');

    return this.vaultItemCategoriesRepository.save(
      this.vaultItemCategoriesRepository.create({
        creatorAccountId: account.id,
        vaultId: vault.id,
        encOverview: options.encOverview,
        encDetails: options.encDetails,
      })
    );
  }

  public format(entity: VaultItemCategoryEntity): VaultItemCategory {
    return this.normalize(entity);
  }

  public formatAll(entities: VaultItemCategoryEntity[]): VaultItemCategory[] {
    return entities.map(e => this.normalize(e));
  }

  public normalize(entity: VaultItemCategoryEntity): VaultItemCategory {
    return {
      uuid: entity.id,
      encOverview: entity.encOverview,
      encDetails: entity.encDetails,
      vaultUuid: entity.vaultId,
      creatorAccountUuid: entity.creatorAccountId,
      lastUpdatedAt: entity.updatedAt.toISOString(),
      createdAt: entity.createdAt.toISOString(),
    };
  }

  public getVaultItemCategories(
    options: FindVaultItemCategoriesOptions,
    ops = { onlyOverview: false }
  ) {
    return this.vaultItemCategoriesRepository.find(
      this.prepareQuery(options, ops)
    );
  }

  public getVaultItemCategory(
    options: FindVaultItemCategoriesOptions,
    ops = { onlyOverview: false }
  ) {
    return this.vaultItemCategoriesRepository.findOne(
      this.prepareQuery(options, ops)
    );
  }

  public prepareQuery(
    options: FindVaultItemCategoriesOptions,
    { onlyOverview } = { onlyOverview: false }
  ): FindManyOptions<VaultItemCategoryEntity> {
    const select: (keyof VaultItemCategoryEntity)[] = [
      'id',
      'encOverview',
      'encDetails',
      'vaultId',
      'creatorAccountId',
      'updatedAt',
      'createdAt',
    ];

    if (onlyOverview) select.splice(select.indexOf('encDetails'), 1);

    return {
      select,
      where: {
        ...options,
        isDeleted: false,
      },
    };
  }
}

export default VaultItemCategoriesService;
