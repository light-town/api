import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Query,
} from '@nestjs/common';
import CurrentAccount from '../auth/current-account';
import FoldersService, {
  FindVaultFoldersOptions,
} from './vault-folders.service';
import { CreateVaultFolderOptions, VaultFolder } from './vault-folders.dto';
import { ApiNotFoundException } from '~/common/exceptions';
import AuthGuard from '../auth/auth.guard';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ParseUUIDPipe, ParseBoolPipe } from '~/common/pipes';
import clearUndefinedProps from '~/utils/clear-undefined-props';

@ApiTags('/folders')
@AuthGuard()
@Controller()
export class VaultFoldersController {
  public constructor(private readonly foldersService: FoldersService) {}

  @ApiCreatedResponse({ type: VaultFolder })
  @Post('/vaults/:vaultUuid/folders')
  public async createVaultFolder(
    @CurrentAccount() account,
    @Param('vaultUuid', new ParseUUIDPipe()) vaultUuid: string,
    @Body() payload: CreateVaultFolderOptions
  ): Promise<VaultFolder> {
    return this.foldersService.format(
      await this.foldersService.createVaultFolder(
        account.id,
        vaultUuid,
        payload
      )
    );
  }

  @ApiOkResponse({ type: [VaultFolder] })
  @Get('/vaults/:vaultUuid/folders')
  public async getVaultFolders(
    @Param('vaultUuid', new ParseUUIDPipe()) vaultUuid: string,
    @Query('root', new ParseBoolPipe({ optional: true })) root: boolean,
    @Query('parentFolderUuid', new ParseUUIDPipe({ optional: true }))
    parentFolderUuid: string
  ): Promise<VaultFolder[]> {
    const options: FindVaultFoldersOptions = {
      vaultId: vaultUuid,
      parentFolderId: parentFolderUuid,
      root,
    };

    clearUndefinedProps(options);

    return this.foldersService.formatAll(
      await this.foldersService.getVaultFolders(options)
    );
  }

  @ApiOkResponse({ type: VaultFolder })
  @Get('/vaults/:vaultUuid/folders/:folderUuid')
  public async getVaultFolder(
    @Param('vaultUuid', new ParseUUIDPipe()) vaultUuid: string,
    @Param('folderUuid', new ParseUUIDPipe()) folderUuid: string
  ): Promise<VaultFolder> {
    const folder = await this.foldersService.getVaultFolder({
      id: folderUuid,
      vaultId: vaultUuid,
    });

    if (!folder) throw new ApiNotFoundException('The folder was not found');

    return this.foldersService.format(folder);
  }

  @ApiOkResponse({ type: [VaultFolder] })
  @Get('/folders')
  public async getFolders(
    @Query('root', new ParseBoolPipe({ optional: true })) root: boolean,
    @Query('parentFolderUuid', new ParseUUIDPipe({ optional: true }))
    parentFolderUuid: string
  ): Promise<VaultFolder[]> {
    const options: FindVaultFoldersOptions = {
      parentFolderId: parentFolderUuid,
      root,
    };

    clearUndefinedProps(options);

    return this.foldersService.formatAll(
      await this.foldersService.getVaultFolders(options)
    );
  }

  @ApiOkResponse({ type: VaultFolder })
  @Get('/folders/:folderUuid')
  public async getFolder(
    @Param('folderUuid', new ParseUUIDPipe()) folderUuid: string
  ): Promise<VaultFolder> {
    const folder = await this.foldersService.getVaultFolder({
      id: folderUuid,
    });

    if (!folder) throw new ApiNotFoundException('The folder was not found');

    return this.foldersService.format(folder);
  }

  @Delete('/vaults/:vaultUuid/folders/:folderUuid')
  public async deleteVaultFolder(
    @Param('vaultUuid', new ParseUUIDPipe()) vaultUuid: string,
    @Param('folderUuid', new ParseUUIDPipe()) folderUuid: string
  ): Promise<void> {
    const folder = await this.foldersService.getVaultFolder({
      id: folderUuid,
      vaultId: vaultUuid,
    });

    if (!folder) throw new ApiNotFoundException('The folder was not found');

    await this.foldersService.deleteVaultFolder(folder.id);
  }
}

export default VaultFoldersController;
