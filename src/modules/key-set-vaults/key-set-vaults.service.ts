import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import KeySetEntity, {
  KeySetVaultEntity,
} from '~/db/entities/key-set-vaults.entity';
import KeySetsService from '../key-sets/key-sets.service';
import VaultsService from '../vaults/vaults.service';

export class FindKeySetVaultOptions {
  id?: string;
  keySetId?: string;
  vaultId?: string;
}

@Injectable()
export class KeySetVaultsService {
  public constructor(
    @InjectRepository(KeySetVaultEntity)
    private readonly keySetVaultRepository: Repository<KeySetVaultEntity>,
    @Inject(forwardRef(() => VaultsService))
    private readonly vaultsService: VaultsService,
    @Inject(forwardRef(() => KeySetsService))
    private readonly keySetsService: KeySetsService
  ) {}

  public async create(
    keySetId: string,
    vaultId: string
  ): Promise<KeySetVaultEntity> {
    if (!(await this.keySetsService.exists({ id: keySetId })))
      throw new ApiNotFoundException('The key set was not found');

    if (!(await this.vaultsService.exists({ id: vaultId })))
      throw new ApiNotFoundException('The vault was not found');

    return this.keySetVaultRepository.save(
      this.keySetVaultRepository.create({
        keySetId,
        vaultId,
      })
    );
  }

  public async exists(options: FindKeySetVaultOptions): Promise<boolean> {
    return (
      (await this.keySetVaultRepository.findOne({
        select: ['id'],
        where: { ...options, isDeleted: false },
      })) !== undefined
    );
  }

  public async getVaultIds(keySetId: string): Promise<string[]> {
    return (
      await this.keySetVaultRepository.find({
        select: ['id', 'vaultId'],
        where: { keySetId, isDeleted: false },
      })
    ).map(k => k.vaultId);
  }

  public async getKeySetIds(vaultId: string): Promise<string[]> {
    return (
      await this.keySetVaultRepository.find({
        select: ['id', 'keySetId'],
        where: { vaultId, isDeleted: false },
      })
    ).map(k => k.keySetId);
  }

  public async getKeySet(vaultId: string): Promise<KeySetEntity> {
    return (
      await this.keySetVaultRepository.findOne({
        select: ['id'],
        where: { vaultId, isDeleted: false },
        join: {
          alias: 'keySetVaults',
          leftJoinAndSelect: {
            keySet: 'keySetVaults.keySet',
          },
        },
      })
    )?.keySet;
  }
}

export default KeySetVaultsService;
