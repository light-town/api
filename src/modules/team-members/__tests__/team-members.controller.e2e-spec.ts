import { getConnectionToken, getRepositoryToken } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import createE2EModuleHelper from './helpers/create-e2e-module.helper';
import createAccountHelper, {
  Account,
} from '~/../__tests__/helpers/create-account.helper';
import { OS } from '~/modules/devices/devices.dto';
import createAndStartSessionHelper from '~/../__tests__/helpers/create-and-start-session.helper';
import Api from './helpers/api.helper';
import initDatabaseHelper from '~/../__tests__/helpers/init-database.helper';
import createTeamHelper from '~/../__tests__/helpers/create-team.helper';
import TeamMemberEntity from '~/db/entities/team-member.entity';
import createTeamMemberHelper from '~/../__tests__/helpers/create-team-member.helper';
import TeamMembersService from '../team-members.service';
import RolesService from '~/modules/roles/roles.service';
import { TeamRolesEnum } from '~/modules/teams/teams.service';

describe('[Team Members Module] [Controller] ...', () => {
  let app: INestApplication;
  let api: Api;
  let connection: Connection;

  let rolesService: RolesService;
  let teamMembersService: TeamMembersService;
  let teamMembersRepository: Repository<TeamMemberEntity>;

  const userAccounts: (Account & { token: string })[] = [];

  beforeAll(async () => {
    app = await createE2EModuleHelper();

    api = new Api(app);

    connection = app.get<Connection>(getConnectionToken());
    await connection.synchronize(true);

    await initDatabaseHelper();

    rolesService = app.get<RolesService>(RolesService);
    teamMembersService = app.get<TeamMembersService>(TeamMembersService);
    teamMembersRepository = app.get<Repository<TeamMemberEntity>>(
      getRepositoryToken(TeamMemberEntity)
    );

    for (let i = 0; i < 3; ++i) {
      const createdUserAccount = await createAccountHelper(app, {
        device: { os: OS.WINDOWS },
      });

      const { token } = await createAndStartSessionHelper(app, {
        accountKey: createdUserAccount.account.key,
        deviceUuid: createdUserAccount.device.id,
        password: createdUserAccount.password,
      });

      userAccounts.push({
        token,
        ...createdUserAccount,
      });
    }
  });

  afterEach(async () => {
    await connection.query('TRUNCATE teams, team_members CASCADE');
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  describe('[Creating] ...', () => {
    it('create a team member', async () => {
      const userAccount = userAccounts[0];
      const memberAccount = userAccounts[1];
      const team = await createTeamHelper(app, {
        accountId: userAccount.account.id,
        publicKey: userAccount.primaryKeySet.publicKey,
      });
      const teamRoleCreator = await rolesService.getRole({
        teamId: team.uuid,
        name: TeamRolesEnum.TEAM_CREATOR,
      });

      const response = await api.createTeamMember(
        team.uuid,
        {
          accountUuid: memberAccount.account.id,
          roleUuid: teamRoleCreator.id,
        },
        userAccount.token
      );

      expect(response.status).toEqual(201);
      expect(response.body).toStrictEqual({
        data: {
          uuid: response.body?.data?.uuid,
          accountUuid: memberAccount.account.id,
          teamUuid: team.uuid,
          lastUpdatedAt: response.body?.data?.lastUpdatedAt,
          createdAt: response.body?.data?.createdAt,
        },
        statusCode: 201,
      });

      expect(await teamMembersRepository.count()).toEqual(2); // first a "creator" member
      const teamMember = await teamMembersRepository.findOne({
        id: response.body.data.uuid,
      });
      expect(teamMember.accountId).toEqual(memberAccount.account.id);
      expect(teamMember.teamId).toEqual(team.uuid);
      expect(teamMember.isDeleted).toBeFalsy();
    });

    it('should throw an error when a not member user trying to create a team member', async () => {
      const userAccount = userAccounts[0];
      const otherUserAccount = userAccounts[1];
      const team = await createTeamHelper(app, {
        accountId: userAccount.account.id,
        publicKey: userAccount.primaryKeySet.publicKey,
      });
      const teamRoleCreator = await rolesService.getRole({
        teamId: team.uuid,
        name: TeamRolesEnum.TEAM_CREATOR,
      });

      const response = await api.createTeamMember(
        team.uuid,
        {
          accountUuid: otherUserAccount.account.id,
          roleUuid: teamRoleCreator.id,
        },
        otherUserAccount.token
      );

      expect(response.status).toEqual(403);
      expect(response.body).toStrictEqual({
        error: {
          type: 'Forbidden',
          message: 'The user is not a member of the team',
        },
        statusCode: 403,
      });

      expect(await teamMembersRepository.count()).toEqual(1);
    });

    it('should throw an error when a low level role user trying to create a team member', async () => {
      const userAccount = userAccounts[0];
      const memberUserAccount = userAccounts[1];
      const otherUserAccount = userAccounts[2];
      const team = await createTeamHelper(app, {
        accountId: userAccount.account.id,
        publicKey: userAccount.primaryKeySet.publicKey,
      });
      const teamRoleMember = await rolesService.getRole({
        teamId: team.uuid,
        name: TeamRolesEnum.TEAM_MEMBER,
      });

      await api.createTeamMember(
        team.uuid,
        {
          accountUuid: memberUserAccount.account.id,
          roleUuid: teamRoleMember.id,
        },
        userAccount.token
      );

      const response = await api.createTeamMember(
        team.uuid,
        {
          accountUuid: otherUserAccount.account.id,
          roleUuid: teamRoleMember.id,
        },
        memberUserAccount.token
      );

      expect(response.status).toEqual(403);
      expect(response.body).toStrictEqual({
        error: {
          type: 'Forbidden',
          message: `Access denied. The user doesn't have enough permissions`,
        },
        statusCode: 403,
      });

      expect(await teamMembersRepository.count()).toEqual(2);
    });
  });

  describe('[Getting] ...', () => {
    it('should return all team members of the team', async () => {
      const userAccount = userAccounts[0];
      const memberAccount = userAccounts[1];
      const team = await createTeamHelper(app, {
        accountId: userAccount.account.id,
        publicKey: userAccount.primaryKeySet.publicKey,
      });

      const creatorMember = await teamMembersService.getTeamMember({
        accountId: userAccount.account.id,
        teamId: team.uuid,
      });

      const teamRoleCreator = await rolesService.getRole({
        teamId: team.uuid,
        name: TeamRolesEnum.TEAM_MEMBER,
      });

      const teamMember = await createTeamMemberHelper(app, {
        creaorAccountId: userAccount.account.id,
        accountId: memberAccount.account.id,
        teamId: team.uuid,
        roleId: teamRoleCreator.id,
      });

      const response = await api.getTeamMembers(team.uuid, userAccount.token);

      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({
        data: await teamMembersService.formatAll([creatorMember, teamMember]),
        statusCode: 200,
      });
    });

    it('should return the team member of the team', async () => {
      const userAccount = userAccounts[0];
      const memberAccount = userAccounts[1];
      const team = await createTeamHelper(app, {
        accountId: userAccount.account.id,
        publicKey: userAccount.primaryKeySet.publicKey,
      });

      const teamRoleCreator = await rolesService.getRole({
        teamId: team.uuid,
        name: TeamRolesEnum.TEAM_MEMBER,
      });

      const teamMember = await createTeamMemberHelper(app, {
        creaorAccountId: userAccount.account.id,
        accountId: memberAccount.account.id,
        teamId: team.uuid,
        roleId: teamRoleCreator.id,
      });

      const response = await api.getTeamMember(
        team.uuid,
        teamMember.id,
        userAccount.token
      );

      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({
        data: await teamMembersService.format(teamMember),
        statusCode: 200,
      });
    });

    it('should throw an error when a user trying to get team members that he is not a member', async () => {
      const userAccount = userAccounts[0];
      const otherUserAccount = userAccounts[1];
      const team = await createTeamHelper(app, {
        accountId: userAccount.account.id,
        publicKey: userAccount.primaryKeySet.publicKey,
      });

      const response = await api.getTeamMembers(
        team.uuid,
        otherUserAccount.token
      );

      expect(response.status).toEqual(403);
      expect(response.body).toStrictEqual({
        error: {
          type: 'Forbidden',
          message: 'The user is not a member of the team',
        },
        statusCode: 403,
      });
    });
  });
});
