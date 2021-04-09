import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, In, Repository } from 'typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import VaultEntity from '~/db/entities/vault.entity';
import KeySetVaultsService from '../key-set-vaults/key-set-vaults.service';
import KeySetsService from '../key-sets/key-sets.service';
import { EncVaultKey, CreateVaultPayload, Vault } from './vaults.dto';

export class FindVaultOptions {
  id?: string;
}

@Injectable()
export class VaultsService {
  public constructor(
    @InjectRepository(VaultEntity)
    private readonly vaultsRepository: Repository<VaultEntity>,
    @Inject(forwardRef(() => KeySetVaultsService))
    private readonly keySetVaultsService: KeySetVaultsService,
    @Inject(forwardRef(() => KeySetsService))
    private readonly keySetsService: KeySetsService
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
        encMetadata: payload.encMetadata,
      })
    );

    /// [TODO] replace from here
    await this.keySetVaultsService.create(primaryKeySet.id, newVault.id);

    return newVault;
  }

  public async exists(options: FindVaultOptions): Promise<boolean> {
    const vault = await this.vaultsRepository.findOne({
      select: ['id'],
      where: { ...options, isDeleted: false },
    });

    return vault !== undefined;
  }

  public async getVaults(keySetId: string): Promise<VaultEntity[]> {
    const vaultIds = await this.keySetVaultsService.getVaultIds(keySetId);
    return this.find({
      select: ['id', 'encKey', 'encMetadata'],
      where: {
        id: In(vaultIds),
        isDeleted: false,
      },
    });
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
      encMetadata: vault.encMetadata,
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
      select: ['id', 'encKey', 'encMetadata'],
      where: {
        ...options,
        isDeleted: false,
      },
    });
  }
}

export default VaultsService;
