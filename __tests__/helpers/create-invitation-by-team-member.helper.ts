import { INestApplication } from '@nestjs/common';
import InvitationsController from '~/modules/invitations/invitations.controller';
import InvitationsService from '~/modules/invitations/invitations.service';
import { CreateKeySetPayload } from '~/modules/key-sets/key-sets.dto';

export class CreateInvitationOptions {
  creatorAccountId: string;
  teaMemberId: string;
  accountId: string;
  teamId: string;
  encKeySet: CreateKeySetPayload;
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
    { id: options.creatorAccountId },
    { id: options.teaMemberId },
    options.teamId,
    {
      accountUuid: options.accountId,
      encKeySet: options.encKeySet,
    }
  );

  return invitationsService.getInvitation({ id: response.uuid });
};

export default createInvitationByTeamMemberHelper;
