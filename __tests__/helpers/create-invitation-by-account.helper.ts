import { INestApplication } from '@nestjs/common';
import InvitationsController from '~/modules/invitations/invitations.controller';
import InvitationsService from '~/modules/invitations/invitations.service';

export class CreateInvitationOptions {
  accountId: string;
  teamId: string;
}

export const createInvitationByAccounHelper = async (
  app: INestApplication,
  options: CreateInvitationOptions
) => {
  const invitationsController = app.get<InvitationsController>(
    InvitationsController
  );
  const invitationsService = app.get<InvitationsService>(InvitationsService);

  const response = await invitationsController.createInvitationByAccount(
    { id: options.accountId },
    {
      teamUuid: options.teamId,
    }
  );

  return invitationsService.getInvitation({ id: response.uuid });
};

export default createInvitationByAccounHelper;
