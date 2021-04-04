import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ModuleRef } from '@nestjs/core';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import {
  ApiForbiddenException,
  ApiNotFoundException,
} from '~/common/exceptions';
import TransactionFor from '~/common/with-transaction';
import AccountEntity from '~/db/entities/account.entity';
import MFATypeEntity from '~/db/entities/mfa-type.entity';
import UserEntity from '~/db/entities/user.entity';
import { MFATypesEnum } from '../auth/auth.dto';
import UsersService from '../users/users.service';
import { CreateAccountDTO } from './accounts.dto';
import DevicesService from '../devices/devices.service';

@Injectable()
export class AccountsService extends TransactionFor {
  public constructor(
    @InjectRepository(AccountEntity)
    private readonly accountsRepository: Repository<AccountEntity>,
    @InjectRepository(MFATypeEntity)
    private readonly mfaTypesRepository: Repository<MFATypeEntity>,
    @Inject(forwardRef(() => DevicesService))
    private readonly devicesService: DevicesService,
    private readonly usersService: UsersService,
    moduleRef: ModuleRef
  ) {
    super(moduleRef);
  }

  public async create(payload: CreateAccountDTO): Promise<AccountEntity> {
    const user: UserEntity = await this.usersService.findOne({
      select: ['id'],
      where: { id: payload.userId, isDeleted: false },
    });

    if (!user) throw new ApiNotFoundException(`The user was not found`);

    const mfaTypeName = payload.mfaType || MFATypesEnum.NONE;

    const mfaType = await this.mfaTypesRepository.findOne({
      select: ['id'],
      where: { name: mfaTypeName },
    });

    if (!mfaType) throw new ApiNotFoundException(`The MFA type was not found`);

    return await this.accountsRepository.save(
      this.accountsRepository.create({
        key: payload.key,
        userId: user.id,
        salt: payload.salt,
        verifier: payload.verifier,
        mfaTypeId: mfaType.id,
      })
    );
  }

  public find(options: FindManyOptions<AccountEntity> = {}) {
    return this.accountsRepository.find(options);
  }

  public findOne(options: FindOneOptions<AccountEntity> = {}) {
    return this.accountsRepository.findOne(options);
  }

  public async setMultiFactorAuthType(
    userId: string,
    accountId: string,
    deviceId,
    type: MFATypesEnum
  ): Promise<void> {
    const account = await this.findOne({
      select: ['id', 'userId'],
      where: {
        id: accountId,
        isDeleted: false,
      },
    });

    if (!account) throw new ApiNotFoundException(`The account was not found`);

    if (account.userId !== userId)
      throw new ApiForbiddenException(`Аccess denied`);

    const mfaType = await this.mfaTypesRepository.findOne({
      select: ['id'],
      where: {
        name: type,
        isDeleted: false,
      },
    });

    if (!mfaType) throw new ApiNotFoundException(`The MFA type was not found`);

    await this.devicesService.createVerificationDevice(deviceId, accountId);

    await this.accountsRepository.update(
      {
        id: account.id,
      },
      {
        mfaTypeId: mfaType.id,
      }
    );
  }

  public async exists(id: string): Promise<boolean> {
    const account = await this.accountsRepository.findOne({
      select: ['id'],
      where: { id, isDeleted: false },
    });
    return account !== undefined;
  }
}

export default AccountsService;
