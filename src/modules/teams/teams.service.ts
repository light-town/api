import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import TeamEntity from '~/db/entities/team.entity';
import AccountsService from '../accounts/accounts.service';
import { CreateTeamOptions, Team } from './teams.dto';

export class FindTeamsOptions {
  id?: string;
  creatorAccountId?: string;
}

@Injectable()
export class TeamsService {
  public constructor(
    public readonly teamsRepository: Repository<TeamEntity>,
    private readonly accountsService: AccountsService
  ) {}

  public async createTeam(
    accountId: string,
    options: CreateTeamOptions
  ): Promise<TeamEntity> {
    const isExistsAccount = await this.accountsService.exists({
      id: accountId,
    });

    if (!isExistsAccount)
      throw new ApiNotFoundException(`The account was not found`);

    const newTeam = await this.teamsRepository.save(
      this.teamsRepository.create({
        encKey: options.encKey,
        encOverview: options.encOverview,
      })
    );

    return newTeam;
  }

  public async format(e: TeamEntity | Promise<TeamEntity>): Promise<Team> {
    const entity = e instanceof Promise ? await e : e;

    return this.normalize(entity);
  }

  public async formatAll(
    e: TeamEntity[] | Promise<TeamEntity[]>
  ): Promise<Team[]> {
    const entities = e instanceof Promise ? await e : e;

    return entities.map(e => this.normalize(e));
  }

  public normalize(entity: TeamEntity): Team {
    return {
      uuid: entity?.id,
      encKey: entity?.encKey,
      encOverview: entity?.encOverview,
      creatorAccountUuid: entity?.creatorAccountId,
      lastUpdatedAt: entity?.updatedAt.toISOString(),
      createdAt: entity?.createdAt.toISOString(),
    };
  }

  public prepareQuery(
    options: FindTeamsOptions
  ): [string, SelectQueryBuilder<TeamEntity>] {
    const alias = 'teams';
    const query = this.teamsRepository
      .createQueryBuilder(alias)
      .select(`${alias}.id`, 'id')
      .addSelect(`${alias}.encKey`, 'encKey')
      .addSelect(`${alias}.encOverview`, 'encOverview')
      .addSelect(`${alias}.creatorAccountId`, 'creatorAccountId')
      .addSelect(`${alias}.updatedAt`, 'updatedAt')
      .addSelect(`${alias}.createdAt`, 'createdAt')
      .where(`${alias}.is_deleted = :isDeleted`, { isDeleted: false });

    if (options.id) query.andWhere(`${alias}.id = :id`, options);

    if (options.creatorAccountId)
      query.andWhere(`${alias}.creator_accountId = :creatorAccountId`, options);

    return [alias, query];
  }

  public async getTeams(options: FindTeamsOptions = {}): Promise<TeamEntity[]> {
    const [_, query] = this.prepareQuery(options);
    return query.getRawMany();
  }

  public getTeam(options: FindTeamsOptions = {}): Promise<TeamEntity> {
    const [_, query] = this.prepareQuery(options);
    return query.getRawOne();
  }
}

export default TeamsService;
