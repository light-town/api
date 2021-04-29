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
import FoldersService from './vault-folders.service';
import { CreateVaultFolderOptions, VaultFolder } from './vault-folders.dto';
import { ApiNotFoundException } from '~/common/exceptions';
import AuthGuard from '../auth/auth.guard';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('/folders')
@AuthGuard()
@Controller()
export class VaultFoldersController {
  public constructor(private readonly foldersService: FoldersService) {}

  @ApiCreatedResponse({ type: VaultFolder })
  @Post('/vaults/:vaultUuid/folders')
  public async createVaultFolder(
    @CurrentAccount() account,
    @Param('vaultUuid') vaultUuid: string,
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
    @Param('vaultUuid') vaultUuid: string,
    @Query('root') root: boolean,
    @Query('parentFolderUuid') parentFolderUuid: string
  ): Promise<VaultFolder[]> {
    return this.foldersService.formatAll(
      await this.foldersService.getVaultFolders({
        vaultId: vaultUuid,
        parentFolderId: parentFolderUuid,
        root,
      })
    );
  }

  @ApiOkResponse({ type: VaultFolder })
  @Get('/vaults/:vaultUuid/folders/:folderUuid')
  public async getVaultFolder(
    @Param('vaultUuid') vaultUuid: string,
    @Param('folderUuid') folderUuid: string
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
    @Query('root') root: boolean,
    @Query('parentFolderUuid') parentFolderUuid: string
  ): Promise<VaultFolder[]> {
    return this.foldersService.formatAll(
      await this.foldersService.getVaultFolders({
        parentFolderId: parentFolderUuid,
        root,
      })
    );
  }

  @ApiOkResponse({ type: VaultFolder })
  @Get('/folders/:folderUuid')
  public async getFolder(
    @Param('folderUuid') folderUuid: string
  ): Promise<VaultFolder> {
    const folder = await this.foldersService.getVaultFolder({
      id: folderUuid,
    });

    if (!folder) throw new ApiNotFoundException('The folder was not found');

    return this.foldersService.format(folder);
  }

  @Delete('/vaults/:vaultUuid/folders/:folderUuid')
  public async deleteVaultFolder(
    @Param('vaultUuid') vaultUuid: string,
    @Param('folderUuid') folderUuid: string
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