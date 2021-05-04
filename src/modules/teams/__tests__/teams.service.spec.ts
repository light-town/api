import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import faker from 'faker';
import { Repository } from 'typeorm';
import createModuleHelper from './helpers/create-module.helper';
import AccountsService from '~/modules/accounts/accounts.service';
import TeamMembersService from '~/modules/team-members/team-members.service';
import TeamEntity from '~/db/entities/team.entity';
import TeamsService, { TeamRolesEnum } from '../teams.service';
import RolesService from '~/modules/roles/roles.service';

describe('[Teams Module] [Service] ...', () => {
  let moduleFixture: TestingModule;

  let teamMembersService: TeamMembersService;
  let accountsService: AccountsService;
  let rolesService: RolesService;

  let teamsService: TeamsService;
  let teamsRepository: Repository<TeamEntity>;

  beforeAll(async () => {
    moduleFixture = await createModuleHelper();

    teamMembersService = moduleFixture.get<TeamMembersService>(
      TeamMembersService
    );
    accountsService = moduleFixture.get<AccountsService>(AccountsService);
    rolesService = moduleFixture.get<RolesService>(RolesService);

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
      const ACCOUNT = {
        id: faker.datatype.uuid(),
      };
      const TEAM_MEMBER = {
        id: faker.datatype.uuid(),
      };
      const MEMBER_ROLE = {
        id: faker.datatype.uuid(),
      };
      const TEAM = {
        id: faker.datatype.uuid(),
        encKey: JSON.parse(faker.datatype.json()),
        encOverview: JSON.parse(faker.datatype.json()),
      };

      jest.spyOn(accountsService, 'exists').mockResolvedValueOnce(true);

      jest.spyOn(teamsRepository, 'create').mockReturnValueOnce(<any>TEAM);

      jest.spyOn(teamsRepository, 'save').mockReturnValueOnce(<any>TEAM);

      jest
        .spyOn(rolesService, 'createRole')
        .mockImplementationOnce((): any => MEMBER_ROLE)
        .mockImplementationOnce((): any => MEMBER_ROLE)
        .mockImplementationOnce((): any => MEMBER_ROLE);

      jest
        .spyOn(teamMembersService, 'createMember')
        .mockResolvedValueOnce(<any>TEAM_MEMBER);

      expect(
        await teamsService.createTeam(ACCOUNT.id, {
          encKey: TEAM.encKey,
          encOverview: TEAM.encOverview,
        })
      ).toStrictEqual(TEAM);

      expect(accountsService.exists).toHaveBeenCalledTimes(1);
      expect(accountsService.exists).toHaveBeenCalledWith({
        id: ACCOUNT.id,
      });

      expect(teamsRepository.create).toHaveBeenCalledTimes(1);
      expect(teamsRepository.create).toHaveBeenCalledWith({
        encKey: TEAM.encKey,
        encOverview: TEAM.encOverview,
        creatorAccountId: ACCOUNT.id,
        invitationKey: (teamsRepository.create as any).mock.calls[0][0]
          .invitationKey,
      });

      expect(teamsRepository.save).toHaveBeenCalledTimes(1);
      expect(teamsRepository.save).toHaveBeenCalledWith(TEAM);

      expect(teamMembersService.createMember).toHaveBeenCalledTimes(1);
      expect(teamMembersService.createMember).toHaveBeenCalledWith({
        accountId: ACCOUNT.id,
        teamId: TEAM.id,
        roleId: MEMBER_ROLE.id,
      });

      expect(rolesService.createRole).toHaveBeenCalledTimes(3);
      expect(rolesService.createRole).toHaveBeenNthCalledWith(1, {
        name: TeamRolesEnum.TEAM_CREATOR,
        teamId: TEAM.id,
      });
      expect(rolesService.createRole).toHaveBeenNthCalledWith(2, {
        name: TeamRolesEnum.TEAM_MEMBER,
        teamId: TEAM.id,
      });
      expect(rolesService.createRole).toHaveBeenNthCalledWith(3, {
        name: TeamRolesEnum.TEAM_GUEST,
        teamId: TEAM.id,
      });
    });
  });
});
