import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  ApiBadRequestException,
  ApiNotFoundException,
} from '~/common/exceptions';
import TeamMemberEntity from '~/db/entities/team-member.entity';
import AccountsService from '../accounts/accounts.service';
import KeySetObjectsService from '../key-set-objects/key-set-objects.service';
import KeySetsService from '../key-sets/key-sets.service';
import RolesService from '../roles/roles.service';
import TeamsService from '../teams/teams.service';
import { TeamMember } from './team-members.dto';

export class FindTeamMembersOptions {
  id?: string;
  teamId?: string;
  accountId?: string;
}

export class CreateTeamMemberOptions {
  teamId: string;
  accountId: string;
  roleId: string;
}

@Injectable()
export class TeamMembersService {
  public constructor(
    @InjectRepository(TeamMemberEntity)
    private readonly teamMembersRepository: Repository<TeamMemberEntity>,
    private readonly accountsService: AccountsService,
    @Inject(forwardRef(() => TeamsService))
    private readonly teamsService: TeamsService,
    @Inject(forwardRef(() => RolesService))
    private readonly rolesService: RolesService,
    @Inject(forwardRef(() => KeySetsService))
    private readonly keySetsService: KeySetsService,
    @Inject(forwardRef(() => KeySetObjectsService))
    private readonly keySetObjectsService: KeySetObjectsService
  ) {}

  public async createMember(
    options: CreateTeamMemberOptions
  ): Promise<TeamMemberEntity> {
    const [
      isTeamExists,
      isAccountExists,
      isRoleExists,
      isMemberAlreadyExists,
    ] = await Promise.all([
      this.teamsService.exists({ id: options.teamId }),
      this.accountsService.exists({ id: options.accountId }),
      this.rolesService.exists({ id: options.roleId, teamId: options.teamId }),
      this.exists({ accountId: options.accountId, teamId: options.teamId }),
    ]);

    if (isMemberAlreadyExists)
      throw new ApiBadRequestException(`The team member already exists`);

    if (!isAccountExists)
      throw new ApiNotFoundException(`The account was not found`);

    if (!isTeamExists) throw new ApiNotFoundException(`The team was not found`);

    if (!isRoleExists) throw new ApiNotFoundException(`The role was not found`);

    if (await this.isMember(options.accountId, options.teamId))
      throw new ApiBadRequestException(
        'The account already has membership with the team'
      );

    const newMember = await this.teamMembersRepository.save(
      this.teamMembersRepository.create({
        accountId: options.accountId,
        teamId: options.teamId,
        roleId: options.roleId,
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
    if (!entity) return;

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
      .where(`${alias}.is_deleted = :isDeleted`, { isDeleted: false });

    if (options?.id) query.andWhere(`${alias}.id = :id`, options);
    if (options?.teamId) query.andWhere(`${alias}.team_id = :teamId`, options);
    if (options?.accountId)
      query.andWhere(`${alias}.account_id = :accountId`, options);

    return [alias, query];
  }

  public async getTeamMembers(
    options: FindTeamMembersOptions = {}
  ): Promise<TeamMemberEntity[]> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getMany();
  }

  public getTeamMember(
    options: FindTeamMembersOptions = {}
  ): Promise<TeamMemberEntity> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getOne();
  }

  public async exists(options: FindTeamMembersOptions = {}): Promise<boolean> {
    const teamMember = await this.teamMembersRepository.findOne({
      ...options,
      isDeleted: false,
    });

    return teamMember !== undefined;
  }

  public isMember(accountId: string, teamId: string): Promise<boolean> {
    return this.exists({ accountId, teamId });
  }

  public async deleteTeamMember(teamMemberId: string): Promise<void> {
    const teamMember = await this.getTeamMember({ id: teamMemberId });

    if (!teamMember)
      throw new ApiNotFoundException(`The team member was not found`);

    this.keySetObjectsService.getKeySetObject({
      teamId: teamMember.teamId,
      ownerAccountId: teamMember.accountId,
    });
  }
}

export default TeamMembersService;
