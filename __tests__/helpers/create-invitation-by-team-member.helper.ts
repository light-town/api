import { INestApplication } from '@nestjs/common';
import InvitationsController from '~/modules/invitations/invitations.controller';
import InvitationsService from '~/modules/invitations/invitations.service';

export class CreateInvitationOptions {
  teaMemberId: string;
  accountId: string;
  teamId: string;
}

export const createInvitationByTeamMemberHelper = async (
  app: INestApplication,
  options: CreateInvitationOptions
) => {
  const invitationsController = app.get<InvitationsController>(
    InvitationsController
  );
  const invitationsService = app.get<InvitationsService>(InvitationsService);

  const response = await invitationsController.createInvitationByTeamMember(
    { id: options.teaMemberId },
    options.teamId,
    {
      accountUuid: options.accountId,
    }
  );

  return invitationsService.getInvitation({ id: response.uuid });
};

export default createInvitationByTeamMemberHelper;
