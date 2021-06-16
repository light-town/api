import core from '@light-town/core';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
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

export type ExtendedTeam = TeamEntity & {
  keySetUuid: string;
  membersCount: number;
  vaultsCount: number;
};

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
    const account = await this.accountsService.findOrThrow({
      id: accountId,
    });

    const accountPrimaryKeySet = await this.keySetsService.getKeySet({
      ownerAccountId: account.id,
      isPrimary: true,
    });

    const newTeam = await this.teamsRepository.save(
      this.teamsRepository.create({
        encKey: options.encKey,
        encOverview: options.encOverview,
        creatorAccountId: account.id,
        invitationKey: core.encryption.common
          .generateCryptoRandomString(32)
          .toLowerCase(),
        salt: options.salt,
      })
    );

    /**
     * Creating a team primary key set
     */
    await this.keySetsService.create(
      account.id,
      newTeam.id,
      options.primaryKeySet,
      { isTeamOwner: true, isPrimary: true }
    );

    /**
     * Linking account primary key set with created team
     */
    await this.keySetObjectsService.createKeySetObject(
      accountPrimaryKeySet.id,
      {
        teamId: newTeam.id,
      }
    );

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
      accountId: account.id,
      teamId: newTeam.id,
      roleId: creatorTeamRole.id,
    });

    return newTeam;
  }

  public async format(e: ExtendedTeam | Promise<ExtendedTeam>): Promise<Team> {
    const entity = e instanceof Promise ? await e : e;
    return this.normalize(entity);
  }

  public async formatAll(
    e: ExtendedTeam[] | Promise<ExtendedTeam[]>
  ): Promise<Team[]> {
    const entities = e instanceof Promise ? await e : e;
    return entities.map(e => this.normalize(e));
  }

  public normalize(e: ExtendedTeam): Team {
    if (!e) return;

    return {
      uuid: e?.id,
      encKey: e?.encKey,
      encOverview: e?.encOverview,
      creatorAccountUuid: e?.creatorAccountId,
      keySetUuid: e.keySetUuid,
      lastUpdatedAt: e?.updatedAt.toISOString(),
      membersCount: e?.membersCount,
      vaultsCount: e?.vaultsCount,
      createdAt: e?.createdAt.toISOString(),
      salt: e?.salt,
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
