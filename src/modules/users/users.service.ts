import { BadRequestException, Injectable } from '@nestjs/common';
import {
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '~/db/entities/user.entity';
import { CreateUserDTO } from './users.dto';

@Injectable()
export class UsersService {
  public constructor(
    @InjectRepository(UserEntity)
    public readonly usersRepository: Repository<UserEntity>
  ) {}

  public async create(
    options: CreateUserDTO,
    entityManager?: EntityManager
  ): Promise<UserEntity> {
    const manager = this.getManager(entityManager);

    if (typeof options.name !== 'string')
      throw new BadRequestException(`The user name must be 'string' type`);

    return await manager.save(
      manager.create(UserEntity, {
        name: options.name,
        avatarUrl: options.avatarUrl,
      })
    );
  }

  public find(
    options: FindManyOptions<UserEntity>,
    entityManager?: EntityManager
  ) {
    const manager = this.getManager(entityManager);
    return manager.find(UserEntity, options);
  }

  public findOne(
    options: FindOneOptions<UserEntity>,
    entityManager?: EntityManager
  ) {
    const manager = this.getManager(entityManager);
    return manager.findOne(UserEntity, options);
  }

  public getManager(entityManager?: EntityManager) {
    return entityManager || this.usersRepository.manager;
  }
}

export default UsersService;
