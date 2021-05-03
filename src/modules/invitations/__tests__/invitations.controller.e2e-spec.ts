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
import InvitationsService from '../invitations.service';
import InvitationEntity from '~/db/entities/invitation.entity';
import { InvitationVerificationStagesEnum } from '../invitations.dto';
import createTeamMemberHelper from '~/../__tests__/helpers/create-team-member.helper';
import RolesService from '~/modules/roles/roles.service';
import { TeamRolesEnum } from '~/modules/teams/teams.service';
import createInvitationByTeamMemberHelper from '~/../__tests__/helpers/create-invitation-by-team-member.helper';
import TeamMembersService from '~/modules/team-members/team-members.service';
import createInvitationByAccounHelper from '~/../__tests__/helpers/create-invitation-by-account.helper';

describe('[Invitations Module] [Controller] ...', () => {
  let app: INestApplication;
  let api: Api;
  let connection: Connection;

  let rolesService: RolesService;
  let invitationsService: InvitationsService;
  let teamMembersService: TeamMembersService;
  let invitationsRepository: Repository<InvitationEntity>;

  const userAccounts: (Account & { token: string })[] = [];

  beforeAll(async () => {
    app = await createE2EModuleHelper();

    api = new Api(app);

    connection = app.get<Connection>(getConnectionToken());
    await connection.synchronize(true);

    await initDatabaseHelper();

    rolesService = app.get<RolesService>(RolesService);
    teamMembersService = app.get<TeamMembersService>(TeamMembersService);
    invitationsService = app.get<InvitationsService>(InvitationsService);
    invitationsRepository = app.get<Repository<InvitationEntity>>(
      getRepositoryToken(InvitationEntity)
    );

    for (let i = 0; i < 10; ++i) {
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
    await connection.query('TRUNCATE invitations CASCADE');
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  describe('[Creating] ...', () => {
    describe('[By Team Member] ...', () => {
      it('create a invitations', async () => {
        const userAccount = userAccounts[0];
        const otherAccount = userAccounts[1];
        const team = await createTeamHelper(app, {
          accountId: userAccount.account.id,
          publicKey: userAccount.primaryKeySet.publicKey,
        });

        const response = await api.createInvitationByTeamMember(
          team.id,
          {
            accountUuid: otherAccount.account.id,
          },
          userAccount.token
        );

        expect(response.status).toEqual(201);
        expect(response.body).toStrictEqual({
          data: {
            uuid: response.body?.data?.uuid,
            accountUuid: otherAccount.account.id,
            teamUuid: team.id,
            accountVerificationStage: {
              uuid: response.body?.data?.accountVerificationStage?.uuid,
              name: InvitationVerificationStagesEnum.AWAITING_ANSWER,
            },
            teamVerificationStage: {
              uuid: response.body?.data?.teamVerificationStage?.uuid,
              name: InvitationVerificationStagesEnum.ACCEPTED,
            },
            expiresAt: response.body?.data?.expiresAt,
            lastUpdatedAt: response.body?.data?.lastUpdatedAt,
            createdAt: response.body?.data?.createdAt,
          },
          statusCode: 201,
        });

        expect(await invitationsRepository.count()).toEqual(1);
        const invitation = await invitationsRepository.findOne({
          id: response.body.data.uuid,
        });
        expect(invitation.teamId).toEqual(team.id);
        expect(invitation.accountId).toEqual(otherAccount.account.id);
        expect(invitation.isDeleted).toBeFalsy();
      });

      it('should throw an error when team member trying to create invitation without needed permission', async () => {
        const userAccount = userAccounts[0];
        const memberAccount = userAccounts[1];
        const otherAccount = userAccounts[2];
        const team = await createTeamHelper(app, {
          accountId: userAccount.account.id,
          publicKey: userAccount.primaryKeySet.publicKey,
        });

        const teamMemberRole = await rolesService.getRole({
          teamId: team.id,
          name: TeamRolesEnum.TEAM_MEMBER,
        });

        await createTeamMemberHelper(app, {
          creaorAccountId: userAccount.account.id,
          accountId: memberAccount.account.id,
          teamId: team.id,
          roleId: teamMemberRole.id,
        });

        const response = await api.createInvitationByTeamMember(
          team.id,
          {
            accountUuid: otherAccount.account.id,
          },
          memberAccount.token
        );

        expect(response.status).toEqual(403);
        expect(response.body).toStrictEqual({
          error: {
            message: `Access denied. The user doesn't have enough permissions`,
            type: 'Forbidden',
          },
          statusCode: 403,
        });
      });

      it('should throw an error when team member trying to create invitation for already exists team member', async () => {
        const userAccount = userAccounts[0];
        const memberAccount = userAccounts[1];
        const team = await createTeamHelper(app, {
          accountId: userAccount.account.id,
          publicKey: userAccount.primaryKeySet.publicKey,
        });

        const teamMemberRole = await rolesService.getRole({
          teamId: team.id,
          name: TeamRolesEnum.TEAM_MEMBER,
        });

        await createTeamMemberHelper(app, {
          creaorAccountId: userAccount.account.id,
          accountId: memberAccount.account.id,
          teamId: team.id,
          roleId: teamMemberRole.id,
        });

        const response = await api.createInvitationByTeamMember(
          team.id,
          {
            accountUuid: memberAccount.account.id,
          },
          userAccount.token
        );

        expect(response.status).toEqual(400);
        expect(response.body).toStrictEqual({
          error: {
            message: 'The user is already team member',
            type: 'Bad Request',
          },
          statusCode: 400,
        });
      });

      it('should throw an error when team member trying to create invitation that already sent invitation earlier', async () => {
        const userAccount = userAccounts[0];
        const otherAccount = userAccounts[1];
        const team = await createTeamHelper(app, {
          accountId: userAccount.account.id,
          publicKey: userAccount.primaryKeySet.publicKey,
        });

        await api.createInvitationByTeamMember(
          team.id,
          {
            accountUuid: otherAccount.account.id,
          },
          userAccount.token
        );

        const response = await api.createInvitationByTeamMember(
          team.id,
          {
            accountUuid: otherAccount.account.id,
          },
          userAccount.token
        );

        expect(response.status).toEqual(400);
        expect(response.body).toStrictEqual({
          error: {
            message:
              'The invitation already exists and it expire time is not passed yet',
            type: 'Bad Request',
          },
          statusCode: 400,
        });
      });
    });

    describe('[By Account] ...', () => {
      it('create a invitations', async () => {
        const userAccount = userAccounts[0];
        const otherAccount = userAccounts[1];
        const team = await createTeamHelper(app, {
          accountId: userAccount.account.id,
          publicKey: userAccount.primaryKeySet.publicKey,
        });

        const response = await api.createInvitationByAccount(
          {
            teamUuid: team.id,
          },
          otherAccount.token
        );

        expect(response.status).toEqual(201);
        expect(response.body).toStrictEqual({
          data: {
            uuid: response.body?.data?.uuid,
            accountUuid: otherAccount.account.id,
            teamUuid: team.id,
            accountVerificationStage: {
              uuid: response.body?.data?.accountVerificationStage?.uuid,
              name: InvitationVerificationStagesEnum.ACCEPTED,
            },
            teamVerificationStage: {
              uuid: response.body?.data?.teamVerificationStage?.uuid,
              name: InvitationVerificationStagesEnum.AWAITING_ANSWER,
            },
            expiresAt: response.body?.data?.expiresAt,
            lastUpdatedAt: response.body?.data?.lastUpdatedAt,
            createdAt: response.body?.data?.createdAt,
          },
          statusCode: 201,
        });

        expect(await invitationsRepository.count()).toEqual(1);
        const invitation = await invitationsRepository.findOne({
          id: response.body.data.uuid,
        });
        expect(invitation.teamId).toEqual(team.id);
        expect(invitation.accountId).toEqual(otherAccount.account.id);
        expect(invitation.isDeleted).toBeFalsy();
      });

      it('should throw an error when user trying to create invitation that already sent invitation earlier', async () => {
        const userAccount = userAccounts[0];
        const otherAccount = userAccounts[1];
        const team = await createTeamHelper(app, {
          accountId: userAccount.account.id,
          publicKey: userAccount.primaryKeySet.publicKey,
        });

        await api.createInvitationByAccount(
          {
            teamUuid: team.id,
          },
          otherAccount.token
        );

        const response = await api.createInvitationByAccount(
          {
            teamUuid: team.id,
          },
          otherAccount.token
        );

        expect(response.status).toEqual(400);
        expect(response.body).toStrictEqual({
          error: {
            message:
              'The invitation already exists and it expire time is not passed yet',
            type: 'Bad Request',
          },
          statusCode: 400,
        });
      });

      it('should throw an error when user that is already a team member trying to create invitation', async () => {
        const userAccount = userAccounts[0];
        const team = await createTeamHelper(app, {
          accountId: userAccount.account.id,
          publicKey: userAccount.primaryKeySet.publicKey,
        });

        const response = await api.createInvitationByAccount(
          {
            teamUuid: team.id,
          },
          userAccount.token
        );

        expect(response.status).toEqual(400);
        expect(response.body).toStrictEqual({
          error: {
            message: 'The user is already team member',
            type: 'Bad Request',
          },
          statusCode: 400,
        });
      });
    });
  });

  describe('[Getting] ...', () => {
    describe('[In Team] ...', () => {
      let teamCreator;
      let teamMemberCreator;
      let team;

      beforeAll(async () => {
        teamCreator = userAccounts[0];
        team = await createTeamHelper(app, {
          accountId: teamCreator.account.id,
          publicKey: teamCreator.primaryKeySet.publicKey,
        });

        teamMemberCreator = await teamMembersService.getTeamMember({
          accountId: teamCreator.account.id,
          teamId: team.id,
        });
      });

      it('should return all invitation by the team', async () => {
        const invitations = [];

        for (let i = 1; i < userAccounts.length; ++i)
          invitations.push(
            await invitationsService.format(
              createInvitationByTeamMemberHelper(app, {
                accountId: userAccounts[i].account.id,
                teamId: team.id,
                teaMemberId: teamMemberCreator.id,
              })
            )
          );

        const response = await api.getTeamInvitations(
          team.id,
          teamCreator.token
        );

        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual({
          data: invitations,
          statusCode: 200,
        });
      });

      it('should return all invitations that is not confirmed', async () => {
        const invitations = [];

        for (let i = 1; i < userAccounts.length; ++i)
          invitations.push(
            await invitationsService.format(
              createInvitationByTeamMemberHelper(app, {
                accountId: userAccounts[i].account.id,
                teamId: team.id,
                teaMemberId: teamMemberCreator.id,
              })
            )
          );

        await api.acceptAccountInvitation(
          invitations[0].uuid,
          userAccounts[1].token
        );

        await api.acceptAccountInvitation(
          invitations[1].uuid,
          userAccounts[2].token
        );

        const response = await api.getTeamInvitations(
          team.id,
          teamCreator.token
        );

        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual({
          data: invitations.slice(2),
          statusCode: 200,
        });
      });

      it('should return specific invitation by the team', async () => {
        const invitations = [];

        for (let i = 1; i < userAccounts.length; ++i)
          invitations.push(
            await invitationsService.format(
              createInvitationByTeamMemberHelper(app, {
                accountId: userAccounts[i].account.id,
                teamId: team.id,
                teaMemberId: teamMemberCreator.id,
              })
            )
          );

        const response = await api.getTeamInvitation(
          team.id,
          invitations[1].uuid,
          teamCreator.token
        );

        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual({
          data: invitations[1],
          statusCode: 200,
        });
      });

      it('should throw an error when required specific invitation is confirmed', async () => {
        const invitations = [];

        for (let i = 1; i < userAccounts.length; ++i)
          invitations.push(
            await invitationsService.format(
              createInvitationByTeamMemberHelper(app, {
                accountId: userAccounts[i].account.id,
                teamId: team.id,
                teaMemberId: teamMemberCreator.id,
              })
            )
          );

        await api.acceptAccountInvitation(
          invitations[0].uuid,
          userAccounts[1].token
        );

        const response = await api.getTeamInvitation(
          team.id,
          invitations[0].uuid,
          teamCreator.token
        );

        expect(response.status).toEqual(404);
        expect(response.body).toStrictEqual({
          error: {
            type: 'Not Found',
            message: 'The invitation was not found',
          },
          statusCode: 404,
        });
      });
    });
    describe('[In Account] ...', () => {
      let teamCreator;
      let account;
      const teams = [];

      beforeAll(async () => {
        teamCreator = userAccounts[0];
        account = userAccounts[1];

        for (let i = 0; i < 10; ++i)
          teams.push(
            await createTeamHelper(app, {
              accountId: teamCreator.account.id,
              publicKey: teamCreator.primaryKeySet.publicKey,
            })
          );
      });

      it('should return all avalible invitation by the account', async () => {
        const invitations = [];

        for (let i = 0; i < teams.length; ++i)
          invitations.push(
            await invitationsService.format(
              createInvitationByAccounHelper(app, {
                accountId: account.account.id,
                teamId: teams[i].id,
              })
            )
          );

        const response = await api.getAccountInvitations(account.token);

        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual({
          data: invitations,
          statusCode: 200,
        });
      });

      it('should return all invitations that is not confirmed', async () => {
        const invitations = [];

        for (let i = 0; i < teams.length; ++i)
          invitations.push(
            await invitationsService.format(
              createInvitationByAccounHelper(app, {
                accountId: account.account.id,
                teamId: teams[i].id,
              })
            )
          );

        await api.acceptTeamInvitation(
          teams[0].id,
          invitations[0].uuid,
          teamCreator.token
        );

        await api.acceptTeamInvitation(
          teams[1].id,
          invitations[1].uuid,
          teamCreator.token
        );

        const response = await api.getAccountInvitations(account.token);

        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual({
          data: invitations.splice(2),
          statusCode: 200,
        });
      });

      it('should return specific invitation by the account', async () => {
        const invitations = [];

        for (let i = 0; i < teams.length; ++i)
          invitations.push(
            await invitationsService.format(
              createInvitationByAccounHelper(app, {
                accountId: account.account.id,
                teamId: teams[i].id,
              })
            )
          );

        const INVITATION = invitations[0];

        const response = await api.getAccountInvitation(
          INVITATION.uuid,
          account.token
        );

        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual({
          data: INVITATION,
          statusCode: 200,
        });
      });

      it('should throw an error when required specific invitation is confirmed', async () => {
        const invitations = [];

        for (let i = 0; i < teams.length; ++i)
          invitations.push(
            await invitationsService.format(
              createInvitationByAccounHelper(app, {
                accountId: account.account.id,
                teamId: teams[i].id,
              })
            )
          );

        const TEAM = teams[0];
        const INVITATION = invitations[0];

        await api.acceptTeamInvitation(
          TEAM.id,
          INVITATION.uuid,
          teamCreator.token
        );

        const response = await api.getAccountInvitation(
          INVITATION.uuid,
          account.token
        );

        expect(response.status).toEqual(404);
        expect(response.body).toStrictEqual({
          error: {
            type: 'Not Found',
            message: 'The invitation was not found',
          },
          statusCode: 404,
        });
      });
    });
  });
});
