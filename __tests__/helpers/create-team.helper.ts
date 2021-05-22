import { INestApplication } from '@nestjs/common';
import core from '@light-town/core';
import faker from 'faker';
import TeamsController from '~/modules/teams/teams.controller';
import TeamsService from '~/modules/teams/teams.service';
import { PublicKey } from '@light-town/core/dist/encryption/common/rsa/definitions';
import KeySetObjectsService from '~/modules/key-set-objects/key-set-objects.service';

export interface CreateTeamOptions {
  accountId: string;
  publicKey: PublicKey;
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

  const symmetricKey = core.encryption.common.generateCryptoRandomString(32);

  const encTeam = await core.helpers.teams.createTeamHelper(
    overview,
    symmetricKey
  );

  const decTeam = await core.helpers.teams.decryptTeamBySecretKeyHelper(
    encTeam,
    symmetricKey
  );

  const muk = await core.helpers.masterUnlockKey.deriveMasterUnlockKeyHelper(
    decTeam.key,
    decTeam.key
  );

  const primaryKeySet = await core.helpers.keySets.createPrimaryKeySetHelper(
    muk
  );

  const accountKeySet = await core.helpers.keySets.createKeySetHelper(
    symmetricKey,
    options.publicKey
  );

  return teamsController.createTeam(
    { id: options.accountId },
    {
      salt: muk.salt,
      encKey: encTeam.encKey,
      encOverview: encTeam.encOverview,
      primaryKeySet,
      accountKeySet,
    }
  );
};

export default createTeamHelper;
