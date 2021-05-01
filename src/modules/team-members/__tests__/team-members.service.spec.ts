import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import faker from 'faker';
import { Repository } from 'typeorm';
import createModuleHelper from './helpers/create-module.helper';
import AccountsService from '~/modules/accounts/accounts.service';
import TeamMembersService from '~/modules/team-members/team-members.service';
import TeamsService from '~/modules/teams/teams.service';
import TeamMemberEntity from '~/db/entities/team-member.entity';
import RolesService from '~/modules/roles/roles.service';

describe('[Team Members Module] [Service] ...', () => {
  let moduleFixture: TestingModule;

  let teamsService: TeamsService;
  let accountsService: AccountsService;
  let rolesService: RolesService;

  let teamMembersService: TeamMembersService;
  let teamMembersRepository: Repository<TeamMemberEntity>;

  beforeAll(async () => {
    moduleFixture = await createModuleHelper();

    teamsService = moduleFixture.get<TeamsService>(TeamsService);
    accountsService = moduleFixture.get<AccountsService>(AccountsService);
    rolesService = moduleFixture.get<RolesService>(RolesService);

    teamMembersService = moduleFixture.get<TeamMembersService>(
      TeamMembersService
    );
    teamMembersRepository = moduleFixture.get<Repository<TeamMemberEntity>>(
      getRepositoryToken(TeamMemberEntity)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('[Creating] ...', () => {
    it('create a team member', async () => {
      const TEST_ACCOUNT = {
        id: faker.datatype.uuid(),
      };
      const TEST_OTHER_ACCOUNT = {
        id: faker.datatype.uuid(),
      };
      const TEST_TEAM_MEMBER = {
        id: faker.datatype.uuid(),
      };
      const TEST_TEAM = {
        id: faker.datatype.uuid(),
      };
      const TEST_ROLE = {
        id: faker.datatype.uuid(),
      };

      jest.spyOn(accountsService, 'exists').mockResolvedValueOnce(true);

      jest.spyOn(teamsService, 'exists').mockResolvedValueOnce(true);

      jest.spyOn(rolesService, 'exists').mockResolvedValueOnce(true);

      jest
        .spyOn(teamMembersRepository, 'create')
        .mockReturnValueOnce(<any>TEST_TEAM_MEMBER);

      jest
        .spyOn(teamMembersRepository, 'save')
        .mockReturnValueOnce(<any>TEST_TEAM_MEMBER);

      expect(
        await teamMembersService.createMember(TEST_ACCOUNT.id, {
          accountId: TEST_OTHER_ACCOUNT.id,
          teamId: TEST_TEAM.id,
          roleId: TEST_ROLE.id,
        })
      ).toStrictEqual(TEST_TEAM_MEMBER);

      expect(accountsService.exists).toHaveBeenCalledTimes(1);
      expect(accountsService.exists).toHaveBeenCalledWith({
        id: TEST_OTHER_ACCOUNT.id,
      });

      expect(teamMembersRepository.create).toHaveBeenCalledTimes(1);
      expect(teamMembersRepository.create).toHaveBeenCalledWith({
        teamId: TEST_TEAM.id,
        accountId: TEST_OTHER_ACCOUNT.id,
        roleId: TEST_ROLE.id,
      });

      expect(teamMembersRepository.save).toHaveBeenCalledTimes(1);
      expect(teamMembersRepository.save).toHaveBeenCalledWith(TEST_TEAM_MEMBER);
    });
  });
});
