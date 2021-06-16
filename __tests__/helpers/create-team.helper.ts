import { INestApplication } from '@nestjs/common';
import core from '@light-town/core';
import faker from 'faker';
import TeamsController from '~/modules/teams/teams.controller';
import {
  PrivateKey,
  PublicKey,
} from '@light-town/core/dist/encryption/common/rsa/definitions';

export interface CreateTeamOptions {
  accountId: string;
  publicKey: PublicKey;
  privateKey: PrivateKey;
  overview?: any;
}

export const createTeamHelper = async (
  app: INestApplication,
  options: CreateTeamOptions
) => {
  const teamsController = app.get<TeamsController>(TeamsController);

  const overview = options.overview ?? {
    name: faker.random.word(),
    desc: faker.random.words(),
  };

  const encTeam = await core.helpers.teams.createTeamHelper(
    overview,
    options.publicKey
  );

  const decTeam = await core.helpers.teams.decryptTeamByPrivateKeyHelper(
    encTeam,
    options.privateKey
  );

  const muk = await core.helpers.masterUnlockKey.deriveMasterUnlockKeyHelper(
    decTeam.key,
    decTeam.key
  );

  const primaryKeySet = await core.helpers.keySets.createPrimaryKeySetHelper(
    muk
  );

  return teamsController.createTeam(
    { id: options.accountId },
    {
      salt: muk.salt,
      encKey: encTeam.encKey,
      encOverview: encTeam.encOverview,
      primaryKeySet,
    }
  );
};

export default createTeamHelper;
