import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import {
  ApiConflictException,
  ApiForbiddenException,
  ApiNotFoundException,
} from '~/common/exceptions';
import KeySetEntity from '~/db/entities/key-set.entity';
import AccountsService from '../accounts/accounts.service';
import VaultsService from '../vaults/vaults.service';
import { CreateKeySetPayload } from './key-sets.dto';
import { EncPrivateKey, EncSymmetricKey, KeySet } from './key-sets.dto';

export class KeySetOptions {
  isPrimary?: boolean;
}

export class CreateKeySetOptions extends KeySetOptions {
  isTeamOwner?: boolean;
  isAccountOwner?: boolean;
}

export class FindKeySetOptions extends KeySetOptions {
  id?: string;
  ids?: string[];
  creatorAccountId?: string;
  ownerAccountId?: string;
  ownerTeamId?: string;
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
    creatorAccountId: string,
    ownerId: string,
    keySet: CreateKeySetPayload,
    options: CreateKeySetOptions = {}
  ): Promise<KeySetEntity> {
    const creatorAccount = await this.accountsService.getAccount({
      id: creatorAccountId,
    });

    if (!creatorAccount)
      throw new ApiNotFoundException('The creator account was not found');

    const newKeySet = this.keySetsRepository.create({
      creatorAccountId: creatorAccount.id,
      publicKey: keySet.publicKey,
      encPrivateKey: keySet.encPrivateKey,
      encSymmetricKey: keySet.encSymmetricKey,
      isPrimary: options.isPrimary,
    });

    if (options.isAccountOwner) {
      if (options.isPrimary && creatorAccount.id !== ownerId)
        throw new ApiForbiddenException(
          'The only account owner can create a primary key set'
        );

      const isAccountExists = await this.accountsService.exists({
        id: ownerId,
      });

      if (!isAccountExists)
        throw new ApiNotFoundException('The account was not found');

      const isAlreadyPrimaryKeySetExists = await this.exists({
        ownerAccountId: ownerId,
        isPrimary: true,
      });

      if (options.isPrimary && isAlreadyPrimaryKeySetExists)
        throw new ApiConflictException(
          'The account owner already has a primary key set'
        );

      newKeySet.ownerAccountId = ownerId;
    } else if (options.isTeamOwner) {
      /// [TODO] check extists team
      // [TODO] check unique primary key set

      newKeySet.ownerTeamId = ownerId;
    } else {
      throw new ApiConflictException(
        `Not defined owner type: 'Account' or 'Team'`
      );
    }

    return this.keySetsRepository.save(newKeySet);
  }

  public getKeySet(options: FindKeySetOptions): Promise<KeySetEntity> {
    const [query] = this.prepareQuery(options);
    return query.getOne();
  }

  public getKeySets(options: FindKeySetOptions): Promise<KeySetEntity[]> {
    const [query] = this.prepareQuery(options);
    return query.getMany();
  }

  public prepareQuery(
    options: FindKeySetOptions
  ): [SelectQueryBuilder<KeySetEntity>, string] {
    const alias = 'key_sets';
    const query = this.keySetsRepository
      .createQueryBuilder(alias)
      .where(`${alias}.isDeleted = :isDeleted`, { isDeleted: false });

    if (options.id) query.andWhere(`${alias}.id = :id`, options);

    if (options.ids) query.andWhere(`${alias}.id = (:...ids)`, options);

    if (options.creatorAccountId)
      query.andWhere(`${alias}.creatorAccountId = :creatorAccountId`, options);

    if (options.ownerAccountId)
      query.andWhere(`${alias}.ownerAccountId = :ownerAccountId`, options);

    if (options.ownerTeamId)
      query.andWhere(`${alias}.ownerTeamId = :ownerTeamId`, options);

    if (options.isPrimary)
      query.andWhere(`${alias}.isPrimary = :isPrimary`, options);

    return [query, alias];
  }

  public async exists(options: FindKeySetOptions): Promise<boolean> {
    const keySet = await this.getKeySet(options);
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
      creatorAccountUuid: keySet.creatorAccountId,
      ownerAccountUuid: keySet.ownerAccountId,
      ownerTeamUuid: keySet.ownerTeamId,
      publicKey: keySet.publicKey,
      encPrivateKey: <EncPrivateKey>keySet.encPrivateKey,
      encSymmetricKey: <EncSymmetricKey>keySet.encSymmetricKey,
      isPrimary: keySet.isPrimary,
    };
  }

  public findOne(options: FindOneOptions<KeySetEntity>): Promise<KeySetEntity> {
    return this.keySetsRepository.findOne(options);
  }

  public find(options: FindManyOptions<KeySetEntity>): Promise<KeySetEntity[]> {
    return this.keySetsRepository.find(options);
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
