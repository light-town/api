import core from '@light-town/core';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import TeamEntity from '~/db/entities/team.entity';
import AccountsService from '../accounts/accounts.service';
import KeySetObjectsService from '../key-set-objects/key-set-objects.service';
import KeySetsService from '../key-sets/key-sets.service';
import { PermissionTypesEnum } from '../permissions/permissions.dto';
import PermissionsService from '../permissions/permissions.service';
import { ObjectTypesEnum } from '../roles/roles.dto';
import RolesService from '../roles/roles.service';
import TeamMembersService from '../team-members/team-members.service';
import { CreateTeamOptions, Team } from './teams.dto';

export class FindTeamsOptions {
  id?: string;
  creatorAccountId?: string;
  memberId?: string;
  memberIds?: string[];
}

export class TeamUpdatableProps {
  invitationKey?: string;
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
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
    @Inject(forwardRef(() => KeySetsService))
    private readonly keySetsService: KeySetsService,
    @Inject(forwardRef(() => KeySetObjectsService))
    private readonly keySetObjectsService: KeySetObjectsService
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
        invitationKey: core.encryption.common
          .generateCryptoRandomString(32)
          .toLowerCase(),
        salt: options.salt,
      })
    );

    await this.keySetsService.create(
      accountId,
      newTeam.id,
      options.primaryKeySet,
      { isTeamOwner: true, isPrimary: true }
    );

    const accountKeySet = await this.keySetsService.create(
      accountId,
      accountId,
      options.accountKeySet,
      { isAccountOwner: true }
    );

    await this.keySetObjectsService.createKeySetObject(accountKeySet.id, {
      teamId: newTeam.id,
    });

    const [creatorTeamRole, memberTeamRole, guestTeamRole] = await Promise.all([
      this.rolesService.createRole({
        name: TeamRolesEnum.TEAM_CREATOR,
        teamId: newTeam.id,
      }),
      this.rolesService.createRole({
        name: TeamRolesEnum.TEAM_MEMBER,
        teamId: newTeam.id,
      }),
      this.rolesService.createRole({
        name: TeamRolesEnum.TEAM_GUEST,
        teamId: newTeam.id,
      }),
    ]);

    await Promise.all([
      this.permissionsService.createPermission({
        roleId: creatorTeamRole.id,
        objectId: newTeam.id,
        objectTypeName: ObjectTypesEnum.TEAM,
        typeName: PermissionTypesEnum.CREATOR,
      }),
      this.permissionsService.createPermission({
        roleId: memberTeamRole.id,
        objectId: newTeam.id,
        objectTypeName: ObjectTypesEnum.TEAM,
        typeName: PermissionTypesEnum.READ_AND_WRITE,
      }),
      this.permissionsService.createPermission({
        roleId: guestTeamRole.id,
        objectId: newTeam.id,
        objectTypeName: ObjectTypesEnum.TEAM,
        typeName: PermissionTypesEnum.READ_ONLY,
      }),
    ]);

    await this.teamMembersService.createMember({
      accountId,
      teamId: newTeam.id,
      roleId: creatorTeamRole.id,
    });

    return newTeam;
  }

  public async format(
    e:
      | (TeamEntity & { keySetUuid: string })
      | Promise<TeamEntity & { keySetUuid: string }>
  ): Promise<Team> {
    const entity = e instanceof Promise ? await e : e;
    return this.normalize(entity);
  }

  public async formatAll(
    e:
      | (TeamEntity & { keySetUuid: string })[]
      | Promise<(TeamEntity & { keySetUuid: string })[]>
  ): Promise<Team[]> {
    const entities = e instanceof Promise ? await e : e;
    return entities.map(e => this.normalize(e));
  }

  public normalize(entity: TeamEntity & { keySetUuid: string }): Team {
    if (!entity) return;

    return {
      uuid: entity?.id,
      encKey: entity?.encKey,
      encOverview: entity?.encOverview,
      creatorAccountUuid: entity?.creatorAccountId,
      keySetUuid: entity.keySetUuid,
      lastUpdatedAt: entity?.updatedAt.toISOString(),
      createdAt: entity?.createdAt.toISOString(),
      salt: entity?.salt,
    };
  }

  public prepareQuery(
    options: FindTeamsOptions
  ): [string, SelectQueryBuilder<TeamEntity>] {
    const alias = 'teams';
    const query = this.teamsRepository
      .createQueryBuilder(alias)
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
    return query.getMany();
  }

  public getTeam(options: FindTeamsOptions = {}): Promise<TeamEntity> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getOne();
  }

  public async exists(options: FindTeamsOptions = {}): Promise<boolean> {
    const team = await this.getTeam(options);
    return team !== undefined;
  }

  public async updateTeams(
    options: FindTeamsOptions,
    props: TeamUpdatableProps
  ): Promise<void> {
    const q: Record<string, any> = {};

    if (props.invitationKey) q.invitationKey = props.invitationKey;

    const query = this.teamsRepository
      .createQueryBuilder()
      .update(TeamEntity)
      .set(q);

    if (options.id) query.andWhere('id = :id', options);
    if (options.creatorAccountId)
      query.andWhere('creatorAccountId = :creatorAccountId', options);

    await query.execute();
  }
}

export default TeamsService;
