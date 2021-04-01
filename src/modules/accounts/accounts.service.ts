import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import {
  ApiForbiddenException,
  ApiNotFoundException,
} from '~/common/exceptions';
import { AccountEntity } from '~/db/entities/account.entity';
import MFATypeEntity from '~/db/entities/mfa-type.entity';
import { UserEntity } from '~/db/entities/user.entity';
import { MFATypesEnum } from '../auth/auth.dto';
import { UsersService } from '../users/users.service';
import { CreateAccountDTO } from './accounts.dto';

@Injectable()
export class AccountsService {
  public constructor(
    @InjectRepository(AccountEntity)
    private readonly accountsRepository: Repository<AccountEntity>,
    @InjectRepository(MFATypeEntity)
    private readonly mfaTypesRepository: Repository<MFATypeEntity>,
    private readonly usersService: UsersService
  ) {}

  public async create(
    payload: CreateAccountDTO,
    entityManager?: EntityManager
  ): Promise<any> {
    const manager = this.getManager(entityManager);

    const user: UserEntity = await this.usersService.findOne(
      {
        select: ['id'],
        where: { id: payload.userId },
      },
      manager
    );

    if (!user) throw new ApiNotFoundException(`The user was not found`);

    const mfaTypeName = payload.mfaType || MFATypesEnum.NONE;

    const mfaType = await this.mfaTypesRepository.findOne({
      select: ['id'],
      where: { name: mfaTypeName },
    });

    if (!mfaType) throw new ApiNotFoundException(`The MFA type was not found`);

    return await manager.save(
      manager.create(AccountEntity, {
        key: payload.key,
        userId: user.id,
        salt: payload.salt,
        verifier: payload.verifier,
        mfaTypeId: mfaType.id,
      })
    );
  }

  public find(
    options: FindManyOptions<AccountEntity> = {},
    entityManager?: EntityManager
  ) {
    const manager = this.getManager(entityManager);
    return manager.find(AccountEntity, options);
  }

  public findOne(
    options: FindOneOptions<AccountEntity> = {},
    entityManager?: EntityManager
  ) {
    const manager = this.getManager(entityManager);
    return manager.findOne(AccountEntity, options);
  }

  public getManager(entityManager?: EntityManager) {
    return entityManager || this.accountsRepository.manager;
  }

  public async setMultiFactorAuthType(
    userUuid: string,
    accountUuid: string,
    type: MFATypesEnum
  ): Promise<void> {
    const account = await this.findOne({
      select: ['id', 'userId'],
      where: {
        id: accountUuid,
        isDeleted: false,
      },
    });

    if (!account) throw new ApiNotFoundException(`The account was not found`);

    if (account.userId !== userUuid)
      throw new ApiForbiddenException(`Аccess denied`);

    const mfaType = await this.mfaTypesRepository.findOne({
      select: ['id'],
      where: {
        name: type,
        isDeleted: false,
      },
    });

    if (!mfaType) throw new ApiNotFoundException(`The MFA type was not found`);

    await this.accountsRepository.update(
      {
        id: account.id,
      },
      {
        mfaTypeId: mfaType.id,
      }
    );
  }
}

export default AccountsService;
