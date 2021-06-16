import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import faker from 'faker';
import { Repository } from 'typeorm';
import createModuleHelper from './helpers/create-module.helper';
import AccountsService from '~/modules/accounts/accounts.service';
import TeamsService from '~/modules/teams/teams.service';
import InvitationsService from '../invitations.service';
import { InvitationVerificationStagesEnum } from '../invitations.dto';
import InvitationVerificationStagesService from '../invitation-verification-stages.service';
import InvitationEntity from '~/db/entities/invitation.entity';

describe('[Invitations Module] [Service] ...', () => {
  let moduleFixture: TestingModule;

  let teamsService: TeamsService;
  let accountsService: AccountsService;
  let invitationVerificationStagesService: InvitationVerificationStagesService;

  let invitationsService: InvitationsService;
  let invitationsRepository: Repository<InvitationEntity>;

  beforeAll(async () => {
    moduleFixture = await createModuleHelper();

    teamsService = moduleFixture.get<TeamsService>(TeamsService);
    accountsService = moduleFixture.get<AccountsService>(AccountsService);
    invitationVerificationStagesService = moduleFixture.get<InvitationVerificationStagesService>(
      InvitationVerificationStagesService
    );

    invitationsService = moduleFixture.get<InvitationsService>(
      InvitationsService
    );
    invitationsRepository = moduleFixture.get<Repository<InvitationEntity>>(
      getRepositoryToken(InvitationEntity)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('[Creating] ...', () => {
    it('create a invitation', async () => {
      const ACCOUNT = {
        id: faker.datatype.uuid(),
      };
      const TEAM = {
        id: faker.datatype.uuid(),
      };
      const INVITATION = {
        id: faker.datatype.uuid(),
      };
      const INVITATION_VERIFICATION_AWAITING_ANSWER_STAGE = {
        id: faker.datatype.uuid(),
        name: InvitationVerificationStagesEnum.AWAITING_ANSWER,
      };
      const INVITATION_VERIFICATION_ACCEPTED_STAGE = {
        id: faker.datatype.uuid(),
        name: InvitationVerificationStagesEnum.ACCEPTED,
      };

      jest.spyOn(accountsService, 'exists').mockResolvedValueOnce(true);

      jest.spyOn(teamsService, 'exists').mockResolvedValueOnce(true);

      jest
        .spyOn(invitationsService, 'getInvitation')
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(<any>INVITATION);

      jest
        .spyOn(
          invitationVerificationStagesService,
          'getInvitationVerificationStage'
        )
        .mockImplementation(({ name }): any =>
          name === InvitationVerificationStagesEnum.AWAITING_ANSWER
            ? INVITATION_VERIFICATION_AWAITING_ANSWER_STAGE
            : name === InvitationVerificationStagesEnum.ACCEPTED
            ? INVITATION_VERIFICATION_ACCEPTED_STAGE
            : undefined
        );

      jest
        .spyOn(invitationsRepository, 'create')
        .mockReturnValueOnce(<any>INVITATION);

      jest
        .spyOn(invitationsRepository, 'save')
        .mockReturnValueOnce(<any>INVITATION);

      expect(
        await invitationsService.createInvitation({
          accountId: ACCOUNT.id,
          teamId: TEAM.id,
          accountVerificationStage:
            InvitationVerificationStagesEnum.AWAITING_ANSWER,
          teamVerificationStage: InvitationVerificationStagesEnum.ACCEPTED,
        })
      ).toStrictEqual(INVITATION);

      expect(accountsService.exists).toHaveBeenCalledTimes(1);
      expect(accountsService.exists).toHaveBeenCalledWith({
        id: ACCOUNT.id,
      });

      expect(invitationsRepository.create).toHaveBeenCalledTimes(1);
      expect(invitationsRepository.create).toHaveBeenCalledWith({
        accountId: ACCOUNT.id,
        teamId: TEAM.id,
        accountVerificationStageId:
          INVITATION_VERIFICATION_AWAITING_ANSWER_STAGE.id,
        teamVerificationStageId: INVITATION_VERIFICATION_ACCEPTED_STAGE.id,
        expiresAt: (invitationsRepository.create as any).mock.calls[0][0]
          .expiresAt,
      });

      expect(invitationsRepository.save).toHaveBeenCalledTimes(1);
      expect(invitationsRepository.save).toHaveBeenCalledWith(INVITATION);
    });
  });
});
