import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, In, Repository } from 'typeorm';
import VaultEntity from '~/db/entities/vault.entity';
import KeySetsService from '../key-sets/key-sets.service';
import { EncVaultKey, CreateVaultPayload, Vault } from './vaults.dto';

@Injectable()
export class VaultsService {
  public constructor(
    @InjectRepository(VaultEntity)
    private readonly vaultsRepository: Repository<VaultEntity>,
    @Inject(forwardRef(() => KeySetsService))
    private readonly keySetsService: KeySetsService
  ) {}

  public async create(vault: CreateVaultPayload): Promise<VaultEntity> {
    return this.vaultsRepository.save(
      this.vaultsRepository.create({
        encKey: vault.encKey,
        encMetadata: vault.encMetadata,
      })
    );
  }

  public async exists(vaultId: string): Promise<boolean> {
    const vault = await this.vaultsRepository.findOne({
      select: ['id'],
      where: { id: vaultId, isDeleted: false },
    });

    return vault !== undefined;
  }

  public async getVaults(accountId: string): Promise<VaultEntity[]> {
    const vaultIds = await this.keySetsService.getVaultIds(accountId);
    return this.find({
      select: ['id', 'encKey', 'encMetadata'],
      where: {
        id: In(vaultIds),
        isDeleted: false,
      },
    });
  }

  public format(vault: VaultEntity): Vault {
    return this.normalize(vault);
  }

  public formatAll(vaults: VaultEntity[]): Vault[] {
    return vaults.map(vault => this.normalize(vault));
  }

  private normalize(vault: VaultEntity): Vault {
    return {
      uuid: vault.id,
      encKey: <EncVaultKey>vault.encKey,
      encMetadata: vault.encMetadata,
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

  public async getVault(vaultId: string): Promise<VaultEntity> {
    return await this.findOne({
      select: ['id', 'encKey', 'encMetadata'],
      where: {
        id: vaultId,
        isDeleted: false,
      },
    });
  }
}

export default VaultsService;
