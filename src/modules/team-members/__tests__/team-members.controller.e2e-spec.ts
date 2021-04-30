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

describe('[Team Members Module] [Controller] ...', () => {
  let app: INestApplication;
  let api: Api;
  let connection: Connection;

  let teamMembersService: TeamMembersService;
  let teamMembersRepository: Repository<TeamMemberEntity>;

  const userAccounts: (Account & { token: string })[] = [];

  beforeAll(async () => {
    app = await createE2EModuleHelper();

    api = new Api(app);

    connection = app.get<Connection>(getConnectionToken());
    await connection.synchronize(true);

    await initDatabaseHelper();

    teamMembersService = app.get<TeamMembersService>(TeamMembersService);
    teamMembersRepository = app.get<Repository<TeamMemberEntity>>(
      getRepositoryToken(TeamMemberEntity)
    );

    for (let i = 0; i < 2; ++i) {
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

      const response = await api.createTeamMember(
        team.id,
        {
          accountUuid: memberAccount.account.id,
        },
        userAccount.token
      );

      expect(response.status).toEqual(201);
      expect(response.body).toStrictEqual({
        data: {
          uuid: response.body?.data?.uuid,
          accountUuid: memberAccount.account.id,
          teamUuid: team.id,
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
      expect(teamMember.teamId).toEqual(team.id);
      expect(teamMember.isDeleted).toBeFalsy();
    });

    /* it('should throw an error when a not member user trying to create a team member', async () => {
      const userAccount = userAccounts[0];
      const otherUserAccount = userAccounts[1];
      const team = await createTeamHelper(app, {
        accountId: userAccount.account.id,
        publicKey: userAccount.primaryKeySet.publicKey,
      });

      const response = await api.createTeamMember(
        team.id,
        {
          accountUuid: otherUserAccount.account.id,
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

      expect(await teamMembersRepository.count()).toEqual(0);
    }); */
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
        teamId: team.id,
      });

      const teamMember = await createTeamMemberHelper(app, {
        creaorAccountId: userAccount.account.id,
        accountId: memberAccount.account.id,
        teamId: team.id,
      });

      const response = await api.getTeamMembers(team.id, userAccount.token);

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

      const teamMember = await createTeamMemberHelper(app, {
        creaorAccountId: userAccount.account.id,
        accountId: memberAccount.account.id,
        teamId: team.id,
      });

      const response = await api.getTeamMember(
        team.id,
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
        team.id,
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
