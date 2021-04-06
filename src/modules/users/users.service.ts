import { Injectable } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '~/db/entities/user.entity';
import { CreateUserDTO } from './users.dto';

@Injectable()
export class UsersService {
  public constructor(
    @InjectRepository(UserEntity)
    public readonly usersRepository: Repository<UserEntity>
  ) {}

  public async create(options: CreateUserDTO): Promise<UserEntity> {
    return await this.usersRepository.save(
      this.usersRepository.create({
        name: options.name,
        avatarUrl: options.avatarUrl,
      })
    );
  }

  public find(options: FindManyOptions<UserEntity>) {
    return this.usersRepository.find(options);
  }

  public findOne(options: FindOneOptions<UserEntity>) {
    return this.usersRepository.findOne(options);
  }
}

export default UsersService;
