import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import TeamEntity from '~/db/entities/team.entity';
import AccountsService from '../accounts/accounts.service';
import RolesService from '../roles/roles.service';
import TeamMembersService from '../team-members/team-members.service';
import { CreateTeamOptions, Team } from './teams.dto';

export class FindTeamsOptions {
  id?: string;
  creatorAccountId?: string;
  memberId?: string;
  memberIds?: string[];
}

export enum TeamRolesEnum {
  TEAM_CREATOR = 'TEAM_CREATOR',
  TEAM_MEMBER = 'TEAM_MEMBER',
  TEAM_GUEST = 'TEAM_GUEST',
}

@Injectable()
export class TeamsService {
  public constructor(
    @InjectRepository(TeamEntity)
    public readonly teamsRepository: Repository<TeamEntity>,
    private readonly accountsService: AccountsService,
    @Inject(forwardRef(() => TeamMembersService))
    private readonly teamMembersService: TeamMembersService,
    @Inject(forwardRef(() => RolesService))
    private readonly rolesService: RolesService
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
        creatorAccountId: accountId,
      })
    );

    const [creatorTeamRole] = await Promise.all([
      this.rolesService.createRole(accountId, {
        name: TeamRolesEnum.TEAM_CREATOR,
        teamId: newTeam.id,
      }),
      this.rolesService.createRole(accountId, {
        name: TeamRolesEnum.TEAM_MEMBER,
        teamId: newTeam.id,
      }),
      this.rolesService.createRole(accountId, {
        name: TeamRolesEnum.TEAM_GUEST,
        teamId: newTeam.id,
      }),
    ]);

    await this.teamMembersService.createMember(accountId, {
      accountId,
      teamId: newTeam.id,
      roleId: creatorTeamRole.id,
    });

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
      .where(`${alias}.is_deleted = :isDeleted`, { isDeleted: false })
      .orderBy(`${alias}.id`);

    if (options.id) query.andWhere(`${alias}.id = :id`, options);

    if (options.creatorAccountId)
      query.andWhere(`${alias}.creator_accountId = :creatorAccountId`, options);

    if (options.memberId)
      query
        .innerJoin(`${alias}.members`, 'members')
        .andWhere(`members.id = :memberId`, options);

    if (options.memberIds)
      query
        .innerJoin(`${alias}.members`, 'members')
        .andWhere(`members.id IN (:...memberIds)`, options);

    return [alias, query];
  }

  public async getTeams(options: FindTeamsOptions = {}): Promise<TeamEntity[]> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getRawMany();
  }

  public getTeam(options: FindTeamsOptions = {}): Promise<TeamEntity> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getRawOne();
  }

  public async exists(options: FindTeamsOptions = {}): Promise<boolean> {
    const team = await this.teamsRepository.findOne({
      ...options,
      isDeleted: false,
    });

    return team !== undefined;
  }
}

export default TeamsService;
