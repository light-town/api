import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import VaultEntity from '~/db/entities/vault.entity';
import KeySetObjectsService from '../key-set-objects/key-set-objects.service';
import KeySetsService from '../key-sets/key-sets.service';
import VaultItemCategoriesService from '../vault-item-categories/vault-item-categories.service';
import { EncVaultKey, CreateVaultPayload, Vault } from './vaults.dto';

export type ExtendedVault = VaultEntity & {
  ownerTeamId?: string;
  ownerAccountId?: string;
  keySetId: string;
  foldersCount: number;
  itemsCount: number;
};

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

  public async createVault(
    creatorAccountId: string,
    keySetId: string,
    payload: CreateVaultPayload
  ): Promise<VaultEntity> {
    const newVault = await this.vaultsRepository.save(
      this.vaultsRepository.create({
        encKey: payload.encKey,
        encOverview: payload.encOverview,
      })
    );

    await Promise.all(
      payload.encCategories.map(c =>
        this.vaultItemCategoriesService.createVaultItemCategory(
          creatorAccountId,
          newVault.id,
          { encOverview: c.encOverview, encDetails: c.encDetails }
        )
      )
    );

    await this.keySetObjectsService.createKeySetObject(keySetId, {
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

  public format(vault: ExtendedVault): Vault {
    return this.normalize(vault);
  }

  public formatAll(vaults: ExtendedVault[]): Vault[] {
    return vaults.map(vault => this.normalize(vault));
  }

  private normalize(vault: ExtendedVault): Vault {
    return {
      uuid: vault.id,
      encKey: <EncVaultKey>vault.encKey,
      encOverview: vault.encOverview,
      ownerAccountUuid: vault.ownerAccountId,
      ownerTeamUuid: vault.ownerTeamId,
      keySetUuid: vault.keySetId,
      lastUpdatedAt: vault.updatedAt.toISOString(),
      createdAt: vault.createdAt.toISOString(),
      foldersCount: vault.foldersCount,
      itemsCount: vault.itemsCount,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getOne();
  }

  public async getVaults(options: FindVaultOptions): Promise<VaultEntity[]> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getMany();
  }

  public async getVaultsByKeySet(keySetId: string): Promise<VaultEntity[]> {
    const vaultIds = await this.keySetObjectsService.getVaultIds(keySetId);

    if (!vaultIds.length) return [];

    return this.getVaults({
      ids: vaultIds,
    });
  }

  public prepareQuery(
    options: FindVaultOptions
  ): [string, SelectQueryBuilder<VaultEntity>] {
    const alias = 'vaults';
    const query = this.vaultsRepository
      .createQueryBuilder(alias)
      .where(`${alias}.isDeleted = :isDeleted`, { isDeleted: false });

    if (options.id) query.andWhere(`${alias}.id = :id`, options);
    if (options.ids) query.andWhere(`${alias}.id IN (:...ids)`, options);

    return [alias, query];
  }

  public async getVaultsCount(options: FindVaultOptions): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getCount();
  }
}

export default VaultsService;
