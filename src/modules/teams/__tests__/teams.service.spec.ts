import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import faker from 'faker';
import { Repository } from 'typeorm';
import createModuleHelper from './helpers/create-module.helper';
import AccountsService from '~/modules/accounts/accounts.service';
import TeamMembersService from '~/modules/team-members/team-members.service';
import TeamEntity from '~/db/entities/team.entity';
import TeamsService from '../teams.service';

describe('[Teams Module] [Service] ...', () => {
  let moduleFixture: TestingModule;

  let teamMembersService: TeamMembersService;
  let accountsService: AccountsService;

  let teamsService: TeamsService;
  let teamsRepository: Repository<TeamEntity>;

  beforeAll(async () => {
    moduleFixture = await createModuleHelper();

    teamMembersService = moduleFixture.get<TeamMembersService>(
      TeamMembersService
    );
    accountsService = moduleFixture.get<AccountsService>(AccountsService);

    teamsService = moduleFixture.get<TeamsService>(TeamsService);
    teamsRepository = moduleFixture.get<Repository<TeamEntity>>(
      getRepositoryToken(TeamEntity)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('[Creating] ...', () => {
    it('create a team', async () => {
      const TEST_ACCOUNT = {
        id: faker.datatype.uuid(),
      };
      const TEST_TEAM_MEMBER = {
        id: faker.datatype.uuid(),
      };
      const TEST_TEAM = {
        id: faker.datatype.uuid(),
        encKey: JSON.parse(faker.datatype.json()),
        encOverview: JSON.parse(faker.datatype.json()),
      };

      jest.spyOn(accountsService, 'exists').mockResolvedValueOnce(true);

      jest.spyOn(teamsRepository, 'create').mockReturnValueOnce(<any>TEST_TEAM);

      jest.spyOn(teamsRepository, 'save').mockReturnValueOnce(<any>TEST_TEAM);

      jest
        .spyOn(teamMembersService, 'createMember')
        .mockResolvedValueOnce(<any>TEST_TEAM_MEMBER);

      expect(
        await teamsService.createTeam(TEST_ACCOUNT.id, {
          encKey: TEST_TEAM.encKey,
          encOverview: TEST_TEAM.encOverview,
        })
      ).toStrictEqual(TEST_TEAM);

      expect(accountsService.exists).toHaveBeenCalledTimes(1);
      expect(accountsService.exists).toHaveBeenCalledWith({
        id: TEST_ACCOUNT.id,
      });

      expect(teamsRepository.create).toHaveBeenCalledTimes(1);
      expect(teamsRepository.create).toHaveBeenCalledWith({
        encKey: TEST_TEAM.encKey,
        encOverview: TEST_TEAM.encOverview,
        creatorAccountId: TEST_ACCOUNT.id,
      });

      expect(teamsRepository.save).toHaveBeenCalledTimes(1);
      expect(teamsRepository.save).toHaveBeenCalledWith(TEST_TEAM);

      expect(teamMembersService.createMember).toHaveBeenCalledTimes(1);
      expect(teamMembersService.createMember).toHaveBeenCalledWith(
        TEST_ACCOUNT.id,
        {
          accountId: TEST_ACCOUNT.id,
          teamId: TEST_TEAM.id,
        }
      );
    });
  });
});
