import { getConnectionToken, getRepositoryToken } from '@nestjs/typeorm';
import faker from 'faker';
import { Connection, Repository } from 'typeorm';
import core from '@light-town/core';
import { INestApplication } from '@nestjs/common';
import createE2EModuleHelper from './helpers/create-e2e-module.helper';
import createAccountHelper, {
  Account,
} from '~/../__tests__/helpers/create-account.helper';
import { OS } from '~/modules/devices/devices.dto';
import createAndStartSessionHelper from '~/../__tests__/helpers/create-and-start-session.helper';
import Api from './helpers/api.helper';
import initDatabaseHelper from '~/../__tests__/helpers/init-database.helper';
import TeamsService from '../teams.service';
import TeamEntity from '~/db/entities/team.entity';
import createTeamHelper from '~/../__tests__/helpers/create-team.helper';
import { Team } from '../teams.dto';

describe('[Teams Module] [Controller] ...', () => {
  let app: INestApplication;
  let api: Api;
  let connection: Connection;

  let teamsService: TeamsService;
  let teamsRepository: Repository<TeamEntity>;

  const userAccounts: (Account & { token: string })[] = [];

  beforeAll(async () => {
    app = await createE2EModuleHelper();

    api = new Api(app);

    connection = app.get<Connection>(getConnectionToken());
    await connection.synchronize(true);

    await initDatabaseHelper();

    teamsService = app.get<TeamsService>(TeamsService);
    teamsRepository = app.get<Repository<TeamEntity>>(
      getRepositoryToken(TeamEntity)
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
    it('create a team', async () => {
      const userAccount = userAccounts[0];
      const overview = {
        name: faker.random.word(),
        decs: faker.random.words(),
      };

      const encTeam = await core.helpers.teams.createTeamHelper(
        overview,
        userAccount.primaryKeySet.publicKey
      );

      const decTeam = await core.helpers.teams.decryptTeamByPrivateKeyHelper(
        encTeam,
        userAccount.primaryKeySet.privateKey
      );

      const muk = await core.helpers.masterUnlockKey.deriveMasterUnlockKeyHelper(
        decTeam.key,
        decTeam.key
      );

      const primaryKeySet = await core.helpers.keySets.createPrimaryKeySetHelper(
        muk
      );

      const response = await api.createTeam(
        {
          ...encTeam,
          salt: muk.salt,
          primaryKeySet,
        },
        userAccount.token
      );

      expect(response.status).toEqual(201);
      expect(response.body).toStrictEqual({
        data: {
          uuid: response.body?.data?.uuid,
          ...encTeam,
          keySetUuid: response.body?.data?.keySetUuid,
          creatorAccountUuid: userAccount.account.id,
          lastUpdatedAt: response.body?.data?.lastUpdatedAt,
          createdAt: response.body?.data?.createdAt,
          salt: muk.salt,
        },
        statusCode: 201,
      });

      expect(await teamsRepository.count()).toEqual(1);
      const team = await teamsRepository.findOne({
        id: response.body.data.uuid,
      });
      expect(team.encKey).toStrictEqual(response.body.data.encKey);
      expect(team.encOverview).toStrictEqual(response.body.data.encOverview);
    });
  });

  describe('[Getting] ...', () => {
    it('should return all teams that the user is a member', async () => {
      const firstUserAccount = userAccounts[0];
      const secondUserAccount = userAccounts[1];
      const teamsPromise: Promise<Team>[] = [];

      for (let i = 0; i < 5; ++i) {
        teamsPromise.push(
          createTeamHelper(app, {
            accountId: firstUserAccount.account.id,
            publicKey: firstUserAccount.primaryKeySet.publicKey,
            privateKey: firstUserAccount.primaryKeySet.privateKey,
          })
        );
        teamsPromise.push(
          createTeamHelper(app, {
            accountId: secondUserAccount.account.id,
            publicKey: secondUserAccount.primaryKeySet.publicKey,
            privateKey: secondUserAccount.primaryKeySet.privateKey,
          })
        );
      }

      const teams = await Promise.all(teamsPromise);

      const response = await api.getTeams(firstUserAccount.token);

      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({
        data: teams
          .filter(t => t.creatorAccountUuid === firstUserAccount.account.id)
          .sort((left, right) =>
            left.uuid < right.uuid ? -1 : left.uuid > right.uuid ? 1 : 0
          ),
        statusCode: 200,
      });
    });

    it('should return the team that the user is a member', async () => {
      const firstUserAccount = userAccounts[0];
      const secondUserAccount = userAccounts[1];
      const teamsPromise: Promise<Team>[] = [];

      for (let i = 0; i < 2; ++i) {
        teamsPromise.push(
          createTeamHelper(app, {
            accountId: firstUserAccount.account.id,
            publicKey: firstUserAccount.primaryKeySet.publicKey,
            privateKey: firstUserAccount.primaryKeySet.privateKey,
          })
        );
        teamsPromise.push(
          createTeamHelper(app, {
            accountId: secondUserAccount.account.id,
            publicKey: secondUserAccount.primaryKeySet.publicKey,
            privateKey: secondUserAccount.primaryKeySet.privateKey,
          })
        );
      }

      const teams = await Promise.all(teamsPromise);

      const response = await api.getTeam(teams[0].uuid, firstUserAccount.token);

      expect(response.status).toEqual(200);
      expect(response.body).toStrictEqual({
        data: teams[0],
        statusCode: 200,
      });
    });

    it('should throw an error when a user trying to get a team that he is not a member', async () => {
      const firstUserAccount = userAccounts[0];
      const secondUserAccount = userAccounts[1];
      const teamsPromise: Promise<Team>[] = [];

      for (let i = 0; i < 2; ++i) {
        teamsPromise.push(
          createTeamHelper(app, {
            accountId: firstUserAccount.account.id,
            publicKey: firstUserAccount.primaryKeySet.publicKey,
            privateKey: firstUserAccount.primaryKeySet.privateKey,
          })
        );
        teamsPromise.push(
          createTeamHelper(app, {
            accountId: secondUserAccount.account.id,
            publicKey: secondUserAccount.primaryKeySet.publicKey,
            privateKey: secondUserAccount.primaryKeySet.privateKey,
          })
        );
      }

      const teams = await Promise.all(teamsPromise);
      const teamFirstUserAccount = teams.filter(
        t => t.creatorAccountUuid === firstUserAccount.account.id
      )[0];

      const response = await api.getTeam(
        teamFirstUserAccount.uuid,
        secondUserAccount.token
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
