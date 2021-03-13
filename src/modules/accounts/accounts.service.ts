import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity } from '~/db/entities/account.entity';
import { UserEntity } from '~/db/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AccountsService {
  public constructor(
    @InjectRepository(AccountEntity)
    private readonly accountsRepository: Repository<AccountEntity>,
    private readonly usersService: UsersService
  ) {}

  public async create(userId: string) {
    const user: UserEntity = await this.usersService.findOne({
      select: ['id'],
      where: { id: userId },
    });

    if (!user) throw new NotFoundException(`The user was not found`);

    return await this.accountsRepository.save(
      this.accountsRepository.create({
        userId: user.id,
      })
    );
  }
}

export default AccountsService;
