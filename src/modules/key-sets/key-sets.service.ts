import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import KeySetEntity from '~/db/entities/key-sets.entity';
import AccountsService from '../accounts/accounts.service';
import VaultsService from '../vaults/vaults.service';
import { CreateKeySetPayload } from './key-sets.dto';
import { EncPrivateKey, EncSymmetricKey, KeySet } from './key-sets.dto';

export class KeySetOption {
  primary?: boolean;
}

export class GetKeySetOption extends KeySetOption {
  accountId?: string;
  vaultId?: string;
}

export class GetKeySetsOption {
  accountId?: string;
  vaultId?: string;
  isPrimary?: boolean;
}

@Injectable()
export class KeySetsService {
  public constructor(
    @InjectRepository(KeySetEntity)
    private readonly keySetsRepository: Repository<KeySetEntity>,
    private readonly accountsService: AccountsService,
    @Inject(forwardRef(() => VaultsService))
    private readonly vaultsService: VaultsService
  ) {}

  public async create(
    accountId: string,
    vaultId: string,
    keySet: CreateKeySetPayload,
    options: KeySetOption = {}
  ): Promise<KeySetEntity> {
    if (!this.accountsService.exists(accountId))
      throw new ApiNotFoundException('The account was not found');

    if (!this.vaultsService.exists(vaultId))
      throw new ApiNotFoundException('The vault was not found');

    return this.keySetsRepository.save(
      this.keySetsRepository.create({
        accountId,
        vaultId,
        publicKey: keySet.publicKey,
        encPrivateKey: keySet.encPrivateKey,
        encSymmetricKey: keySet.encSymmetricKey,
        isPrimary: options.primary,
      })
    );
  }

  public async getKeySet(
    options: GetKeySetOption = { primary: false }
  ): Promise<KeySetEntity> {
    const keySet = await this.findOne({
      select: ['id', 'publicKey', 'encPrivateKey', 'encSymmetricKey'],
      where: {
        accountId: options.accountId,
        vaultId: options.vaultId,
        isPrimary: options.primary,
        isDeleted: false,
      },
    });

    if (!keySet)
      throw new ApiNotFoundException('The primary key set was not found');

    return keySet;
  }

  public async getKeySets(options: GetKeySetsOption): Promise<KeySetEntity[]> {
    return this.find({
      select: ['id', 'publicKey', 'encPrivateKey', 'encSymmetricKey'],
      where: {
        ...options,
        isDeleted: false,
      },
    });
  }

  public async exists(keySetId: string): Promise<boolean> {
    const keySet = await this.keySetsRepository.findOne({
      select: ['id'],
      where: { id: keySetId, isDeleted: false },
    });

    return keySet !== undefined;
  }

  public format(vault: KeySetEntity): KeySet {
    return this.normalize(vault);
  }

  public formatAll(vaults: KeySetEntity[]): KeySet[] {
    return vaults.map(vault => this.normalize(vault));
  }

  private normalize(keySet: KeySetEntity): KeySet {
    return {
      uuid: keySet.id,
      publicKey: keySet.publicKey,
      encPrivateKey: <EncPrivateKey>keySet.encPrivateKey,
      encSymmetricKey: <EncSymmetricKey>keySet.encSymmetricKey,
    };
  }

  public findOne(options: FindOneOptions<KeySetEntity>): Promise<KeySetEntity> {
    return this.keySetsRepository.findOne(options);
  }

  public find(options: FindManyOptions<KeySetEntity>): Promise<KeySetEntity[]> {
    return this.keySetsRepository.find(options);
  }

  public async getVaultIds(accountId: string): Promise<string[]> {
    return (
      await this.find({
        select: ['id', 'vaultId'],
        where: {
          accountId,
          isDeleted: false,
        },
      })
    ).map(keySet => keySet.vaultId);
  }

  public async deleteKeySet(keySetId: string): Promise<void> {
    await this.keySetsRepository.update(
      {
        id: keySetId,
        isDeleted: false,
      },
      {
        isDeleted: true,
      }
    );
  }
}

export default KeySetsService;
