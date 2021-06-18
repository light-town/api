import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import KeySetsService from '../key-sets/key-sets.service';
import { PermissionTypesEnum } from '../permissions/permissions.dto';
import { ObjectTypesEnum } from '../roles/roles.dto';
import RolesService from '../roles/roles.service';
import CurrentTeamMember from '../team-members/current-team-member.decorator';
import { CurrentTeamMemberInterceptor } from '../team-members/current-team-member.interceptor';
import TeamMembersService from '../team-members/team-members.service';
import TeamsService, { TeamRolesEnum } from '../teams/teams.service';
import {
  AcceptInvitationByTeamMemberPayload,
  CreateInvitationByAccountPayload,
  CreateInvitationByTeamMemberPayload,
  Invitation,
  InvitationLink,
  InvitationVerificationStagesEnum,
  UpdateInvitationLinkKey,
} from './invitations.dto';
import { InvitationsService } from './invitations.service';

@AuthGuard()
@Controller()
export class InvitationsController {
  public constructor(
    private readonly invitationsService: InvitationsService,
    private readonly teamsService: TeamsService,
    private readonly teamMembersService: TeamMembersService,
    private readonly rolesService: RolesService,
    private readonly keySetsService: KeySetsService
  ) {}

  @ApiTags('/teams/invitations')
  @ApiCreatedResponse({ type: Invitation })
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Post('/teams/:teamUuid/invitations')
  public async createInvitationByTeamMember(
    @CurrentAccount() account,
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

    const newInvitation = await this.invitationsService.format(
      this.invitationsService.createInvitation({
        accountId: payload.accountUuid,
        teamId: teamUuid,
        accountVerificationStage:
          InvitationVerificationStagesEnum.AWAITING_ANSWER,
        teamVerificationStage: InvitationVerificationStagesEnum.ACCEPTED,
      })
    );

    await this.keySetsService.create(
      account.id,
      payload.accountUuid,
      payload.encKeySet,
      {
        isAccountOwner: true,
      }
    );

    return newInvitation;
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
    @CurrentAccount() account,
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string,
    @Param('invitationUuid') invitationUuid: string,
    @Body() payload: AcceptInvitationByTeamMemberPayload
  ): Promise<void> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.ADMINISTRATOR
    );

    const invitation = await this.invitationsService.getInvitation({
      id: invitationUuid,
      teamId: teamUuid,
    });

    await this.invitationsService.updateInvitation(
      {
        id: invitationUuid,
        teamId: teamUuid,
      },
      { teamVerificationStage: InvitationVerificationStagesEnum.ACCEPTED }
    );

    await this.keySetsService.create(
      account.id,
      invitation.accountId,
      payload.encKeySet,
      {
        isAccountOwner: true,
      }
    );

    const teamMemberRole = await this.rolesService.getRole({
      name: TeamRolesEnum.TEAM_MEMBER,
      teamId: teamUuid,
    });

    await this.teamMembersService.createMember({
      teamId: teamUuid,
      accountId: invitation.accountId,
      roleId: teamMemberRole.id,
    });
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
    const invitation = await this.invitationsService.getInvitation({
      id: invitationUuid,
      accountId: account.id,
    });

    await this.invitationsService.updateInvitation(
      {
        id: invitationUuid,
        accountId: account.id,
      },
      { accountVerificationStage: InvitationVerificationStagesEnum.ACCEPTED }
    );

    const teamMemberRole = await this.rolesService.getRole({
      name: TeamRolesEnum.TEAM_MEMBER,
      teamId: invitation.teamId,
    });

    await this.teamMembersService.createMember({
      teamId: invitation.teamId,
      accountId: invitation.accountId,
      roleId: teamMemberRole.id,
    });
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

  @ApiTags('/teams/invitations')
  @ApiOkResponse({ type: InvitationLink })
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Get('/teams/:teamUuid/invitation-link')
  public async getInvitationLink(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string
  ): Promise<InvitationLink> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.ADMINISTRATOR
    );

    const team = await this.teamsService.getTeam({ id: teamUuid });

    return {
      secretKey: team.invitationKey,
    };
  }

  @ApiTags('/teams/invitations')
  @Patch('/teams/:teamUuid/join')
  public async joinByInvitationLink(
    @CurrentAccount() account,
    @Param('teamUuid') teamUuid: string,
    @Query('key') key: string
  ): Promise<void> {
    const team = await this.teamsService.getTeam({ id: teamUuid });

    if (!team) throw new ApiNotFoundException(`The team was not found`);

    if (team.invitationKey !== key)
      throw new ApiForbiddenException(`Access denied. The keys are not match`);

    await this.invitationsService.createInvitation({
      accountId: account.id,
      teamId: team.id,
      accountVerificationStage: InvitationVerificationStagesEnum.ACCEPTED,
      teamVerificationStage: InvitationVerificationStagesEnum.AWAITING_ANSWER,
    });
  }

  @ApiTags('/teams/invitations')
  @UseInterceptors(CurrentTeamMemberInterceptor)
  @Put('/teams/:teamUuid/invitations/link')
  public async updateInvitationLinkKey(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string,
    @Body() payload: UpdateInvitationLinkKey
  ): Promise<void> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.ADMINISTRATOR
    );

    await this.teamsService.updateTeams(
      { id: teamUuid },
      { invitationKey: payload.secretKey }
    );
  }
}

export default InvitationsController;
