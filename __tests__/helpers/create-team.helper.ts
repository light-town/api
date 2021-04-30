import { INestApplication } from '@nestjs/common';
import core from '@light-town/core';
import faker from 'faker';
import TeamsController from '~/modules/teams/teams.controller';
import TeamsService from '~/modules/teams/teams.service';
import { PublicKey } from '@light-town/core/dist/encryption/common/rsa/definitions';

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
  const teamsService = app.get<TeamsService>(TeamsService);

  const overview = options.overview ?? {
    name: faker.random.word(),
    desc: faker.random.words(),
  };

  const encTeam = await core.helpers.teams.createTeamHelper(
    overview,
    options.publicKey
  );
  const team = await teamsController.createTeam(
    { id: options.accountId },
    {
      encKey: encTeam.encKey,
      encOverview: encTeam.encOverview,
    }
  );

  return teamsService.getTeam({ id: team.uuid });
};

export default createTeamHelper;
