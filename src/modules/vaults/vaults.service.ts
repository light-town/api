import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, In, Repository } from 'typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import VaultEntity from '~/db/entities/vault.entity';
import KeySetObjectsService from '../key-set-objects/key-set-objects.service';
import KeySetsService from '../key-sets/key-sets.service';
import VaultItemCategoriesService from '../vault-item-categories/vault-item-categories.service';
import { EncVaultKey, CreateVaultPayload, Vault } from './vaults.dto';

export class FindVaultOptions {
  id?: string;
  ids?: string[];
}

@Injectable()
export class VaultsService {
  public constructor(
    @InjectRepository(VaultEntity)
    private readonly vaultsRepository: Repository<VaultEntity>,
    @Inject(forwardRef(() => KeySetObjectsService))
    private readonly keySetObjectsService: KeySetObjectsService,
    @Inject(forwardRef(() => KeySetsService))
    private readonly keySetsService: KeySetsService,
    @Inject(forwardRef(() => VaultItemCategoriesService))
    private readonly vaultItemCategoriesService: VaultItemCategoriesService
  ) {}

  public async create(
    accountId: string,
    payload: CreateVaultPayload
  ): Promise<VaultEntity> {
    const primaryKeySet = await this.keySetsService.getKeySet({
      ownerAccountId: accountId,
      isPrimary: true,
    });

    if (!primaryKeySet)
      throw new ApiNotFoundException(
        'The primary key set of account was not found'
      );

    const newVault = await this.vaultsRepository.save(
      this.vaultsRepository.create({
        encKey: payload.encKey,
        encOverview: payload.encOverview,
      })
    );

    await Promise.all(
      payload.encCategories.map(c =>
        this.vaultItemCategoriesService.createVaultItemCategory(
          accountId,
          newVault.id,
          { encOverview: c.encOverview, encDetails: c.encDetails }
        )
      )
    );

    await this.keySetObjectsService.createKeySetObject(primaryKeySet.id, {
      vaultId: newVault.id,
    });

    return newVault;
  }

  public async exists(options: FindVaultOptions): Promise<boolean> {
    const vault = await this.vaultsRepository.findOne({
      select: ['id'],
      where: { ...options, isDeleted: false },
    });

    return vault !== undefined;
  }

  public format(
    vault: VaultEntity,
    accountId: string,
    keySetId: string
  ): Vault {
    return this.normalize(vault, accountId, keySetId);
  }

  public formatAll(
    vaults: VaultEntity[],
    accountId: string,
    keySetId: string
  ): Vault[] {
    return vaults.map(vault => this.normalize(vault, accountId, keySetId));
  }

  private normalize(
    vault: VaultEntity,
    accountId: string,
    keySetId: string
  ): Vault {
    return {
      uuid: vault.id,
      encKey: <EncVaultKey>vault.encKey,
      encOverview: vault.encOverview,
      accountUuid: accountId,
      keySetUuid: keySetId,
    };
  }

  public find(options: FindManyOptions<VaultEntity>): Promise<VaultEntity[]> {
    return this.vaultsRepository.find(options);
  }
  public findOne(options: FindOneOptions<VaultEntity>): Promise<VaultEntity> {
    return this.vaultsRepository.findOne(options);
  }

  public async deleteVault(vaultId: string): Promise<void> {
    await this.vaultsRepository.update(
      {
        id: vaultId,
        isDeleted: false,
      },
      { isDeleted: true }
    );
  }

  public async getVault(options: FindVaultOptions): Promise<VaultEntity> {
    return await this.findOne({
      select: ['id', 'encKey', 'encOverview'],
      where: {
        ...options,
        isDeleted: false,
      },
    });
  }

  public async getVaults(options: FindVaultOptions): Promise<VaultEntity[]> {
    const alias = 'vaults';
    const query = this.vaultsRepository
      .createQueryBuilder(alias)
      .where(`${alias}.isDeleted = :isDeleted`, { isDeleted: false });

    if (options.id) query.andWhere(`${alias}.id = :id`, options);
    if (options.ids) query.andWhere(`${alias}.id IN (:...ids)`, options);

    return query.getMany();
  }

  public async getVaultsByKeySet(keySetId: string): Promise<VaultEntity[]> {
    const vaultIds = await this.keySetObjectsService.getVaultIds(keySetId);

    if (!vaultIds.length) return [];

    return this.getVaults({
      ids: vaultIds,
    });
  }
}

export default VaultsService;
