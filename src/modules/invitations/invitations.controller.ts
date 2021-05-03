import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiForbiddenException,
  ApiNotFoundException,
} from '~/common/exceptions';
import AuthGuard from '../auth/auth.guard';
import CurrentAccount from '../auth/current-account';
import { PermissionTypesEnum } from '../permissions/permissions.dto';
import { ObjectTypesEnum } from '../roles/roles.dto';
import RolesService from '../roles/roles.service';
import CurrentTeamMember from '../team-members/current-team-member.decorator';
import { CurrentTeamMemberInterceptor } from '../team-members/current-team-member.interceptor';
import TeamsService from '../teams/teams.service';
import {
  CreateInvitationByAccountPayload,
  CreateInvitationByTeamMemberPayload,
  Invitation,
  InvitationVerificationStagesEnum,
} from './invitations.dto';
import { InvitationsService } from './invitations.service';

@AuthGuard()
@Controller()
export class InvitationsController {
  public constructor(
    private readonly invitationsService: InvitationsService,
    private readonly teamsService: TeamsService,
    private readonly rolesService: RolesService
  ) {}

  @ApiTags('/teams/invitations')
  @ApiCreatedResponse({ type: Invitation })
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Post('/teams/:teamUuid/invitations')
  public async createInvitationByTeamMember(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string,
    @Body() payload: CreateInvitationByTeamMemberPayload
  ): Promise<Invitation> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.ADMINISTRATOR
    );

    return this.invitationsService.format(
      this.invitationsService.createInvitation({
        accountId: payload.accountUuid,
        teamId: teamUuid,
        accountVerificationStage:
          InvitationVerificationStagesEnum.AWAITING_ANSWER,
        teamVerificationStage: InvitationVerificationStagesEnum.ACCEPTED,
      })
    );
  }

  @ApiTags('/invitations')
  @ApiCreatedResponse({ type: Invitation })
  @Post('/invitations')
  public async createInvitationByAccount(
    @CurrentAccount() account,
    @Body() payload: CreateInvitationByAccountPayload
  ): Promise<Invitation> {
    const isTeamExists = await this.teamsService.exists({
      id: payload.teamUuid,
    });

    if (!isTeamExists)
      throw new ApiForbiddenException(`The team was not found`);

    return this.invitationsService.format(
      this.invitationsService.createInvitation({
        accountId: account.id,
        teamId: payload.teamUuid,
        accountVerificationStage: InvitationVerificationStagesEnum.ACCEPTED,
        teamVerificationStage: InvitationVerificationStagesEnum.AWAITING_ANSWER,
      })
    );
  }

  @ApiTags('/teams/invitations')
  @ApiOkResponse({ type: Invitation })
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Patch('/teams/:teamUuid/invitations/:invitationUuid/accept')
  public async acceptInvitationByTeamMember(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string,
    @Param('invitationUuid') invitationUuid: string
  ): Promise<void> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.ADMINISTRATOR
    );

    await this.invitationsService.updateInvitation(
      {
        id: invitationUuid,
        teamId: teamUuid,
      },
      { teamVerificationStage: InvitationVerificationStagesEnum.ACCEPTED }
    );
  }

  @ApiTags('/teams/invitations')
  @ApiOkResponse({ type: Invitation })
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Patch('/teams/:teamUuid/invitations/:invitationUuid/reject')
  public async rejectInvitationByTeamMember(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string,
    @Param('invitationUuid') invitationUuid: string
  ): Promise<void> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.ADMINISTRATOR
    );

    await this.invitationsService.updateInvitation(
      {
        id: invitationUuid,
        teamId: teamUuid,
      },
      { teamVerificationStage: InvitationVerificationStagesEnum.REJECTED }
    );
  }

  @ApiTags('/invitations')
  @ApiOkResponse({ type: Invitation })
  @Patch('/invitations/:invitationUuid/accept')
  public async acceptInvitationByAccount(
    @CurrentAccount() account,
    @Param('invitationUuid') invitationUuid: string
  ): Promise<void> {
    await this.invitationsService.updateInvitation(
      {
        id: invitationUuid,
        accountId: account.id,
      },
      { accountVerificationStage: InvitationVerificationStagesEnum.ACCEPTED }
    );
  }

  @ApiTags('/invitations')
  @ApiOkResponse({ type: Invitation })
  @Patch('/invitations/:invitationUuid/reject')
  public async rejectInvitationByAccount(
    @CurrentAccount() account,
    @Param('invitationUuid') invitationUuid: string
  ): Promise<void> {
    await this.invitationsService.updateInvitation(
      {
        id: invitationUuid,
        accountId: account.id,
      },
      { accountVerificationStage: InvitationVerificationStagesEnum.REJECTED }
    );
  }

  @ApiTags('/teams/invitations')
  @ApiOkResponse({ type: [Invitation] })
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Get('/teams/:teamUuid/invitations')
  public async getTeamInvitations(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string
  ): Promise<Invitation[]> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.ADMINISTRATOR
    );

    return this.invitationsService.formatAll(
      this.invitationsService.getInvitations({
        teamId: teamUuid,
      })
    );
  }

  @ApiTags('/teams/invitations')
  @ApiOkResponse({ type: Invitation })
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Get('/teams/:teamUuid/invitations/:invitationUuid')
  public async getTeamInvitation(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string,
    @Param('invitationUuid') invitationUuid: string
  ): Promise<Invitation> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.ADMINISTRATOR
    );

    const invitation = await this.invitationsService.format(
      this.invitationsService.getInvitation({
        id: invitationUuid,
        teamId: teamUuid,
      })
    );

    if (!invitation)
      throw new ApiNotFoundException(`The invitation was not found`);

    return invitation;
  }

  @ApiTags('/invitations')
  @ApiOkResponse({ type: [Invitation] })
  @Get('/invitations')
  public async getAccountInvitations(
    @CurrentAccount() account,
    @Query('team-uuid') teamUuid: string
  ): Promise<Invitation[]> {
    return this.invitationsService.formatAll(
      this.invitationsService.getInvitations({
        accountId: account.id,
        teamId: teamUuid,
      })
    );
  }

  @ApiTags('/invitations')
  @ApiOkResponse({ type: Invitation })
  @Get('/invitations/:invitationUuid')
  public async getAccountInvitation(
    @CurrentAccount() account,
    @Param('invitationUuid') invitationUuid: string
  ): Promise<Invitation> {
    const invitation = await this.invitationsService.format(
      this.invitationsService.getInvitation({
        id: invitationUuid,
        accountId: account.id,
      })
    );

    if (!invitation)
      throw new ApiNotFoundException(`The invitation was not found`);

    return invitation;
  }
}

export default InvitationsController;
