import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import AuthGuard from '../auth/auth.guard';
import CurrentAccount from '../auth/current-account';
import { PermissionTypesEnum } from '../permissions/permissions.dto';
import { ObjectTypesEnum } from '../roles/roles.dto';
import RolesService from '../roles/roles.service';
import CurrentTeamMember from '../team-members/current-team-member.decorator';
import { CurrentTeamMemberInterceptor } from '../team-members/current-team-member.interceptor';
import { KeySet } from './key-sets.dto';
import KeySetsService, { FindKeySetOptions } from './key-sets.service';

@AuthGuard()
@ApiTags('/key-sets')
@Controller()
export class KeySetsController {
  public constructor(
    private readonly keySetsService: KeySetsService,
    private readonly rolesService: RolesService
  ) {}

  @ApiOkResponse({ type: [KeySet] })
  @Get('/key-sets')
  public async getKeySets(
    @CurrentAccount() account,
    @Query('primary') primary: string
  ): Promise<KeySet[]> {
    const options: FindKeySetOptions = { ownerAccountId: account.id };

    if (primary === 'true') options.isPrimary = true;

    return this.keySetsService.formatAll(
      await this.keySetsService.getKeySets(options)
    );
  }

  @ApiOkResponse({ type: KeySet })
  @Get('/key-sets/:keySetUuid')
  public async getKeySet(
    @CurrentAccount() account,
    @Param('keySetUuid') keySetUuid: string,
    @Query('primary') primary: string
  ): Promise<KeySet> {
    const options: FindKeySetOptions = {
      id: keySetUuid,
      ownerAccountId: account.id,
    };

    if (primary === 'true') options.isPrimary = true;

    return this.keySetsService.format(
      await this.keySetsService.getKeySet(options)
    );
  }

  @UseInterceptors(CurrentTeamMemberInterceptor)
  @ApiOkResponse({
    type: KeySet,
  })
  @Get('/teams/:teamUuid/key-sets')
  public async getTeamKeySets(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string,
    @Query('primary') primary: string
  ): Promise<KeySet[]> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.READ_ONLY
    );

    const options: FindKeySetOptions = {
      ownerTeamId: teamUuid,
    };

    if (primary === 'true') options.isPrimary = true;

    return this.keySetsService.formatAll(
      await this.keySetsService.getKeySets(options)
    );
  }

  @UseInterceptors(CurrentTeamMemberInterceptor)
  @ApiOkResponse({
    type: KeySet,
  })
  @Get('/teams/:teamUuid/key-sets')
  public async getTeamKeySet(
    @CurrentTeamMember() teamMember,
    @Param('teamUuid') teamUuid: string,
    @Query('primary') primary: string
  ): Promise<KeySet> {
    await this.rolesService.validateOrFail(
      teamMember.id,
      teamUuid,
      ObjectTypesEnum.TEAM,
      PermissionTypesEnum.READ_ONLY
    );

    const options: FindKeySetOptions = {
      ownerTeamId: teamUuid,
    };

    if (primary === 'true') options.isPrimary = true;

    return this.keySetsService.format(
      await this.keySetsService.getKeySet(options)
    );
  }
}

export default KeySetsController;
