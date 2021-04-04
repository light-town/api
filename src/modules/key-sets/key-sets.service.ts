import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import KeySetEntity from '~/db/entities/key-sets.entity';
import AccountsService from '../accounts/accounts.service';
import VaultsService from '../vaults/vaults.service';
import { PrimaryKeySet } from './key-sets.dto';
import { EncPrivateKey, EncSymmetricKey, KeySet } from './key-sets.dto';

export class CreateKeySetOption {
  primary: boolean;
}

@Injectable()
export class KeySetsService {
  public constructor(
    @InjectRepository(KeySetEntity)
    private readonly keySetsRepository: Repository<KeySetEntity>,
    private readonly accountsService: AccountsService,
    private readonly vaultsService: VaultsService
  ) {}

  public create(
    accountId: string,
    vaultId: string,
    keySet: PrimaryKeySet,
    options: CreateKeySetOption = { primary: false }
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

  public async getPrimaryKeySet(accountId: string): Promise<KeySet> {
    const keySet = await this.findOne({
      select: ['id', 'publicKey', 'encPrivateKey', 'encSymmetricKey'],
      where: {
        accountId,
        isPrimary: true,
        isDeleted: false,
      },
    });

    if (!keySet)
      throw new ApiNotFoundException('The primary key set was not found');

    return {
      uuid: keySet.id,
      publicKey: keySet.publicKey,
      encPrivateKey: <EncPrivateKey>keySet.encPrivateKey,
      encSymmetricKey: <EncSymmetricKey>keySet.encSymmetricKey,
    };
  }

  public async getKeySets(accountId: string): Promise<KeySet[]> {
    return (
      await this.find({
        select: ['id', 'publicKey', 'encPrivateKey', 'encSymmetricKey'],
        where: {
          accountId,
          isDeleted: false,
        },
      })
    ).map(keySet => ({
      uuid: keySet.id,
      publicKey: keySet.publicKey,
      encPrivateKey: <EncPrivateKey>keySet.encPrivateKey,
      encSymmetricKey: <EncSymmetricKey>keySet.encSymmetricKey,
    }));
  }

  public async exists(keySetId: string): Promise<boolean> {
    const keySet = await this.keySetsRepository.findOne({
      select: ['id'],
      where: { id: keySetId, isDeleted: false },
    });

    return keySet !== undefined;
  }

  public findOne(options: FindOneOptions<KeySetEntity>): Promise<KeySetEntity> {
    return this.keySetsRepository.findOne(options);
  }

  public find(options: FindManyOptions<KeySetEntity>): Promise<KeySetEntity[]> {
    return this.keySetsRepository.find(options);
  }
}

export default KeySetsService;
