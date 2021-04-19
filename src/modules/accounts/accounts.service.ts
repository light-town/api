import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import AccountEntity from '~/db/entities/account.entity';
import MFATypeEntity from '~/db/entities/mfa-type.entity';
import UserEntity from '~/db/entities/user.entity';
import { CreateAccountDTO, Account } from './accounts.dto';
import { MFATypesEnum } from '../auth/auth.dto';
import UsersService from '../users/users.service';
import DevicesService from '../devices/devices.service';

export class FindAccountOptions {
  id?: string;
  key?: string;
  userId?: string;
  mfaTypeId?: string;
}

@Injectable()
export class AccountsService {
  public constructor(
    @InjectRepository(AccountEntity)
    private readonly accountsRepository: Repository<AccountEntity>,
    @InjectRepository(MFATypeEntity)
    private readonly mfaTypesRepository: Repository<MFATypeEntity>,
    @Inject(forwardRef(() => DevicesService))
    private readonly devicesService: DevicesService,
    private readonly usersService: UsersService
  ) {}

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

  public async exists(options: FindAccountOptions): Promise<boolean> {
    const account = await this.accountsRepository.findOne({
      select: ['id'],
      where: { ...options, isDeleted: false },
    });
    return account !== undefined;
  }

  public async getAccount(options: FindAccountOptions): Promise<AccountEntity> {
    return this.findOne({
      select: ['id', 'key', 'mfaTypeId', 'userId'],
      where: { ...options, isDeleted: false },
      join: {
        alias: 'accounts',
        leftJoinAndSelect: {
          user: 'accounts.user',
        },
      },
    });
  }

  public async getAccounts(
    options: FindAccountOptions
  ): Promise<AccountEntity[]> {
    return this.find({
      select: ['id', 'key', 'mfaTypeId', 'userId', 'user', 'mfaType'],
      where: { ...options, isDeleted: false },
      join: {
        alias: 'accounts',
        leftJoinAndSelect: {
          user: 'accounts.user',
          mfaType: 'accounts.mfaType',
        },
      },
    });
  }

  public format(account: AccountEntity): Account {
    return this.normalize(account);
  }

  public formatAll(accounts: AccountEntity[]): Account[] {
    return accounts.map(a => this.normalize(a));
  }

  public normalize(account: AccountEntity): Account {
    return {
      accountUuid: account.id,
      accountName: account.user.name,
      accountAvatarUrl: account.user.avatarUrl,
      userUuid: account.user.id,
      userName: account.user.name,
      userAvatarUrl: account.user.avatarUrl,
      MFAType: account.mfaType.name,
    };
  }
}

export default AccountsService;
