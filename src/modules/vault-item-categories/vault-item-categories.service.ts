import { Injectable } from '@nestjs/common';
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
    private readonly accountsService: AccountsService,
    private readonly vaultsService: VaultsService
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
      vaultUuid: entity.vaultId,
      creatorAccountUuid: entity.creatorAccountId,
      lastUpdatedAt: entity.updatedAt.toISOString(),
      createdAt: entity.createdAt.toISOString(),
    };
  }

  public getVaultItemCategories(options: FindVaultItemCategoriesOptions) {
    return this.vaultItemCategoriesRepository.find(this.prepareQuery(options));
  }

  public getVaultItemCategory(options: FindVaultItemCategoriesOptions) {
    return this.vaultItemCategoriesRepository.findOne(
      this.prepareQuery(options)
    );
  }

  public prepareQuery(
    options: FindVaultItemCategoriesOptions
  ): FindManyOptions<VaultItemCategoryEntity> {
    return {
      select: [
        'id',
        'encOverview',
        'vaultId',
        'creatorAccountId',
        'updatedAt',
        'createdAt',
      ],
      where: {
        ...options,
        isDeleted: false,
      },
    };
  }
}

export default VaultItemCategoriesService;
