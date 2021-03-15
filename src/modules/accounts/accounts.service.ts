import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { AccountEntity } from '~/db/entities/account.entity';
import { UserEntity } from '~/db/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateAccountDTO } from './accounts.dto';

@Injectable()
export class AccountsService {
  public constructor(
    @InjectRepository(AccountEntity)
    private readonly accountsRepository: Repository<AccountEntity>,
    private readonly usersService: UsersService
  ) {}

  public async create(payload: CreateAccountDTO): Promise<any> {
    const { key, userId, salt, verifier } = payload;

    const user: UserEntity = await this.usersService.findOne({
      select: ['id'],
      where: { id: userId },
    });

    if (!user) throw new NotFoundException(`The user was not found`);

    return await this.accountsRepository.save(
      this.accountsRepository.create({
        key,
        userId: user.id,
        salt,
        verifier,
      })
    );
  }

  public find(options: FindManyOptions<AccountEntity> = {}) {
    return this.accountsRepository.find(options);
  }

  public findOne(options: FindOneOptions<AccountEntity> = {}) {
    return this.accountsRepository.findOne(options);
  }
}

export default AccountsService;
