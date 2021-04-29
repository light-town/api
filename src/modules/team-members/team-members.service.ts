import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import TeamMemberEntity from '~/db/entities/team-member.entity';
import AccountsService from '../accounts/accounts.service';
import TeamsService from '../teams/teams.service';
import { TeamMember } from './team-members.dto';

export class FindTeamMembersOptions {
  id?: string;
  teamId?: string;
  accountId?: string;
}

@Injectable()
export class TeamMembersService {
  public constructor(
    @InjectRepository(TeamMemberEntity)
    private readonly teamMembersRepository: Repository<TeamMemberEntity>,
    @Inject(forwardRef(() => TeamsService))
    private readonly teamsService: TeamsService,
    private readonly accountsService: AccountsService
  ) {}

  public async createMember(
    teamId: string,
    accountId: string
  ): Promise<TeamMemberEntity> {
    const [isTeamExists, isAccountExists] = await Promise.all([
      this.teamsService.exists({ id: teamId }),
      this.accountsService.exists({ id: accountId }),
    ]);

    if (!isAccountExists)
      throw new ApiNotFoundException(`The account was not found`);

    if (!isTeamExists) throw new ApiNotFoundException('The team was not found');

    const newMember = await this.teamMembersRepository.save(
      this.teamMembersRepository.create({
        accountId,
        teamId,
      })
    );

    return newMember;
  }

  public async format(
    e: TeamMemberEntity | Promise<TeamMemberEntity>
  ): Promise<TeamMember> {
    return this.normalize(e instanceof Promise ? await e : e);
  }

  public async formatAll(
    e: TeamMemberEntity[] | Promise<TeamMemberEntity[]>
  ): Promise<TeamMember[]> {
    const entities = e instanceof Promise ? await e : e;

    return entities.map(e => this.normalize(e));
  }

  public normalize(entity: TeamMemberEntity): TeamMember {
    return {
      uuid: entity?.id,
      accountUuid: entity?.accountId,
      teamUuid: entity?.teamId,
      lastUpdatedAt: entity?.updatedAt.toISOString(),
      createdAt: entity?.createdAt.toISOString(),
    };
  }

  public prepareQuery(
    options: FindTeamMembersOptions
  ): [string, SelectQueryBuilder<TeamMemberEntity>] {
    const alias = 'team_members';
    const query = this.teamMembersRepository
      .createQueryBuilder(alias)
      .select(`${alias}.id`, 'id')
      .addSelect(`${alias}.accountId`, 'accountId')
      .addSelect(`${alias}.teamId`, 'teamId')
      .addSelect(`${alias}.updatedAt`, 'updatedAt')
      .addSelect(`${alias}.createdAt`, 'createdAt')
      .where(`${alias}.is_deleted = :isDeleted`, { isDeleted: false });

    if (options.id) query.andWhere(`${alias}.id = :id`, options);
    if (options.teamId) query.andWhere(`${alias}.team_id = :teamId`, options);
    if (options.accountId)
      query.andWhere(`${alias}.account_id = :accountId`, options);

    return [alias, query];
  }

  public async getTeamMembers(
    options: FindTeamMembersOptions = {}
  ): Promise<TeamMemberEntity[]> {
    const [_, query] = this.prepareQuery(options);
    return query.getRawMany();
  }

  public getTeamMember(
    options: FindTeamMembersOptions = {}
  ): Promise<TeamMemberEntity> {
    const [_, query] = this.prepareQuery(options);
    return query.getRawOne();
  }

  public async exists(options: FindTeamMembersOptions = {}): Promise<boolean> {
    const teamMember = await this.teamMembersRepository.findOne({
      ...options,
      isDeleted: false,
    });

    return teamMember !== undefined;
  }
}

export default TeamMembersService;
