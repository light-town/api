import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import KeySetEntity from '~/db/entities/key-sets.entity';
import AccountsService from '../accounts/accounts.service';
import VaultsService from '../vaults/vaults.service';
import { PrimaryKeySet } from './key-sets.dto';

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
    keySet: PrimaryKeySet
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
      })
    );
  }

  public async exists(keySetId: string): Promise<boolean> {
    const keySet = await this.keySetsRepository.findOne({
      select: ['id'],
      where: { id: keySetId, isDeleted: false },
    });

    return keySet !== undefined;
  }
}

export default KeySetsService;
