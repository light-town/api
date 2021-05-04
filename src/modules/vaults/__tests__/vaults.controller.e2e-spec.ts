import faker from 'faker';
import { Connection, Repository } from 'typeorm';
import core from '@light-town/core';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken, getRepositoryToken } from '@nestjs/typeorm';
import createE2EModuleHelper from './helpers/create-e2e-module.helper';
import initDatabaseHelper from '~/../__tests__/helpers/init-database.helper';
import APIHelper from './helpers/api.helper';
import { OS } from '~/modules/devices/devices.dto';
import VaultEntity from '~/db/entities/vault.entity';
import KeySetEntity from '~/db/entities/key-set.entity';
import createAccountHelper from '~/../__tests__/helpers/create-account.helper';
import createAndStartSessionHelper from '~/../__tests__/helpers/create-and-start-session.helper';
import createVaultHelper from '~/../__tests__/helpers/create-vault.helper';
import createTeamHelper from '~/../__tests__/helpers/create-team.helper';
import createTeamVaultHelper from '~/../__tests__/helpers/create-team-vault.helper';
import TeamMembersService from '~/modules/team-members/team-members.service';

describe('[Vaults Module] [Controller] ...', () => {
  let app: INestApplication;
  let api: APIHelper;
  let connection: Connection;
  let vaultsRepository: Repository<VaultEntity>;
  let keySetsRepository: Repository<KeySetEntity>;
  let teamMembersService: TeamMembersService;

  beforeAll(async () => {
    app = await createE2EModuleHelper();

    api = new APIHelper(app);

    connection = app.get<Connection>(getConnectionToken());
    await connection.synchronize(true);

    await initDatabaseHelper();

    vaultsRepository = app.get<Repository<VaultEntity>>(
      getRepositoryToken(VaultEntity)
    );
    keySetsRepository = app.get<Repository<KeySetEntity>>(
      getRepositoryToken(KeySetEntity)
    );
    teamMembersService = app.get<TeamMembersService>(TeamMembersService);
  });

  beforeEach(async () => {
    await connection.query(
      'TRUNCATE vaults, key_sets, key_set_objects CASCADE'
    );
  });

  afterAll(async () => {
    await app.close();
    await connection.close();
  });

  describe('[Account] ...', () => {
    let context;

    beforeEach(async () => {
      const {
        account,
        device,
        password,
        masterUnlockKey,
        primaryKeySet,
        primaryVault,
      } = await createAccountHelper(app, { device: { os: OS.WINDOWS } });

      const { token } = await createAndStartSessionHelper(app, {
        accountKey: account.key,
        deviceUuid: device.id,
        password,
      });

      context = {
        token,
        account,
        device,
        password,
        masterUnlockKey,
        primaryKeySet,
        primaryVault,
      };
    });

    describe('[Creating] ...', () => {
      it('should create a vault', async () => {
        const {
          publicKey,
        } = await core.encryption.common.rsa.generateKeyPair();

        const encVault = await core.helpers.vaults.createVaultHelper(
          {
            name: faker.random.word(),
            desc: faker.random.word(),
          },
          publicKey
        );

        const response = await api.createVault(
          {
            ...encVault,
            encCategories: [],
          },
          context.token
        );

        expect(response.status).toEqual(201);
        expect(response.body).toStrictEqual({
          data: {
            uuid: response.body?.data?.uuid,
            ...encVault,
            ownerAccountUuid: context.account.id,
            keySetUuid: context.primaryKeySet.id,
          },
          statusCode: 201,
        });

        expect(await vaultsRepository.count()).toStrictEqual(2); // primary vault and previously created

        const vault = await vaultsRepository.findOne({
          where: { id: response.body.data.uuid },
        });
        expect(vault).toStrictEqual(
          vaultsRepository.create({
            id: vault.id,
            ...encVault,
            createdAt: vault.createdAt,
            updatedAt: vault.updatedAt,
            isDeleted: false,
          })
        );
      });
    });

    describe('[Getting] ...', () => {
      it('should get all vaults', async () => {
        const vaults = [context.primaryVault];
        for (let i = 0; i < 10; i++)
          vaults.push(
            await createVaultHelper(app, {
              accountId: context.account.id,
              publicKey: context.primaryKeySet.publicKey,
              privateKey: context.primaryKeySet.privateKey,
            })
          );

        const response = await api.getVaults(context.token);

        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual({
          data: vaults.map(v => ({
            uuid: v.id,
            encKey: v.encKey,
            encOverview: v.encOverview,
            ownerAccountUuid: context.account.id,
            keySetUuid: context.primaryKeySet.id,
          })),
          statusCode: 200,
        });
      });

      it('should get one vault', async () => {
        const vault = await createVaultHelper(app, {
          accountId: context.account.id,
          publicKey: context.primaryKeySet.publicKey,
          privateKey: context.primaryKeySet.privateKey,
        });

        const response = await api.getVault(vault.id, context.token);

        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual({
          data: {
            uuid: vault.id,
            encKey: vault.encKey,
            encOverview: vault.encOverview,
            ownerAccountUuid: context.account.id,
            keySetUuid: context.primaryKeySet.id,
          },
          statusCode: 200,
        });
      });

      it('should get the key set vaults', async () => {
        const vaults = [context.primaryVault];
        for (let i = 0; i < 10; i++)
          vaults.push(
            await createVaultHelper(app, {
              accountId: context.account.id,
              publicKey: context.primaryKeySet.publicKey,
              privateKey: context.primaryKeySet.privateKey,
            })
          );

        const response = await api.getKeySetVaults(
          context.primaryKeySet.id,
          context.token
        );

        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual({
          data: vaults.map(v => ({
            uuid: v.id,
            encKey: v.encKey,
            encOverview: v.encOverview,
            ownerAccountUuid: context.account.id,
            keySetUuid: context.primaryKeySet.id,
          })),
          statusCode: 200,
        });
      });

      it('should get the key set vault', async () => {
        const vault = await createVaultHelper(app, {
          accountId: context.account.id,
          publicKey: context.primaryKeySet.publicKey,
          privateKey: context.primaryKeySet.privateKey,
        });

        const response = await api.getKeySetVault(
          context.primaryKeySet.id,
          vault.id,
          context.token
        );

        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual({
          data: {
            uuid: vault.id,
            encKey: vault.encKey,
            encOverview: vault.encOverview,
            ownerAccountUuid: context.account.id,
            keySetUuid: context.primaryKeySet.id,
          },
          statusCode: 200,
        });
      });
    });

    describe('[Deleting] ...', () => {
      it('should delete a vaults', async () => {
        const vault = await createVaultHelper(app, {
          accountId: context.account.id,
          publicKey: context.primaryKeySet.publicKey,
          privateKey: context.primaryKeySet.privateKey,
        });

        const response = await api.deleteVault(vault.id, context.token);

        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual({
          statusCode: 200,
        });

        expect(await vaultsRepository.count()).toStrictEqual(2);

        const updatedVault = await vaultsRepository.findOne({
          where: { id: vault.id },
        });
        expect(updatedVault).toStrictEqual(
          vaultsRepository.create({
            ...updatedVault,
            isDeleted: true,
          })
        );

        expect(await keySetsRepository.count()).toStrictEqual(1);
      });
    });
  });

  describe('[Team] ...', () => {
    let userAccount;

    beforeEach(async () => {
      const {
        account,
        device,
        password,
        masterUnlockKey,
        primaryKeySet,
        primaryVault,
      } = await createAccountHelper(app, { device: { os: OS.WINDOWS } });

      const { token } = await createAndStartSessionHelper(app, {
        accountKey: account.key,
        deviceUuid: device.id,
        password,
      });

      userAccount = {
        token,
        account,
        device,
        password,
        masterUnlockKey,
        primaryKeySet,
        primaryVault,
      };
    });

    describe('[Creating] ...', () => {
      it('should create a vault', async () => {
        const team = await createTeamHelper(app, {
          accountId: userAccount.account.id,
          publicKey: userAccount.primaryKeySet.publicKey,
        });

        const encVault = await core.helpers.vaults.createVaultHelper(
          {
            name: faker.random.word(),
            desc: faker.random.word(),
          },
          userAccount.primaryKeySet.publicKey
        );

        const response = await api.createTeamVault(
          team.id,
          {
            ...encVault,
            encCategories: [],
          },
          userAccount.token
        );

        expect(response.status).toEqual(201);
        expect(response.body).toStrictEqual({
          data: {
            uuid: response.body?.data?.uuid,
            ...encVault,
            ownerTeamUuid: team.id,
            keySetUuid: response.body?.data?.keySetUuid,
          },
          statusCode: 201,
        });

        expect(await vaultsRepository.count()).toStrictEqual(2); // primary vault and previously created

        const vault = await vaultsRepository.findOne({
          where: { id: response.body.data.uuid },
        });
        expect(vault).toStrictEqual(
          vaultsRepository.create({
            id: vault.id,
            ...encVault,
            createdAt: vault.createdAt,
            updatedAt: vault.updatedAt,
            isDeleted: false,
          })
        );
      });
    });

    describe('[Getting] ...', () => {
      it('should get all vaults', async () => {
        const team = await createTeamHelper(app, {
          accountId: userAccount.account.id,
          publicKey: userAccount.primaryKeySet.publicKey,
        });

        const teamMember = await teamMembersService.getTeamMember({
          teamId: team.id,
          accountId: userAccount.account.id,
        });

        const vaults = [];
        for (let i = 0; i < 10; i++)
          vaults.push(
            await createTeamVaultHelper(app, {
              accountId: userAccount.account.id,
              teamMemberId: teamMember.id,
              teamId: teamMember.teamId,
              publicKey: userAccount.primaryKeySet.publicKey,
              privateKey: userAccount.primaryKeySet.privateKey,
            })
          );

        const response = await api.getTeamVaults(
          teamMember.teamId,
          userAccount.token
        );

        let i = 0;
        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual({
          data: vaults.map(v => ({
            uuid: v.id,
            encKey: v.encKey,
            encOverview: v.encOverview,
            ownerTeamUuid: teamMember.teamId,
            keySetUuid: response.body?.data[i++].keySetUuid,
          })),
          statusCode: 200,
        });
      });

      it('should get one vault', async () => {
        const team = await createTeamHelper(app, {
          accountId: userAccount.account.id,
          publicKey: userAccount.primaryKeySet.publicKey,
        });

        const teamMember = await teamMembersService.getTeamMember({
          teamId: team.id,
          accountId: userAccount.account.id,
        });

        const vaults = [];
        for (let i = 0; i < 10; i++)
          vaults.push(
            await createTeamVaultHelper(app, {
              accountId: userAccount.account.id,
              teamMemberId: teamMember.id,
              teamId: teamMember.teamId,
              publicKey: userAccount.primaryKeySet.publicKey,
              privateKey: userAccount.primaryKeySet.privateKey,
            })
          );

        const VAULT = vaults[2];

        const response = await api.getTeamVault(
          teamMember.teamId,
          VAULT.id,
          userAccount.token
        );

        expect(response.status).toEqual(200);
        expect(response.body).toStrictEqual({
          data: {
            uuid: VAULT.id,
            encKey: VAULT.encKey,
            encOverview: VAULT.encOverview,
            ownerTeamUuid: teamMember.teamId,
            keySetUuid: response.body?.data?.keySetUuid,
          },
          statusCode: 200,
        });
      });
    });
  });
});
