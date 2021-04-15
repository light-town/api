import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import VaultFolderEntity from '~/db/entities/vault-folder.entity';
import AccountsService from '../accounts/accounts.service';
import VaultsService from '../vaults/vaults.service';
import { CreateVaultFolderOptions, VaultFolder } from './vault-folders.dto';

export interface FindVaultFoldersOptions {
  id?: string;
  vaultId?: string;
  creatorAccountId?: string;
}

@Injectable()
export class VaultFoldersService {
  public constructor(
    @InjectRepository(VaultFolderEntity)
    private readonly foldersRepository: Repository<VaultFolderEntity>,
    private readonly accountsService: AccountsService,
    private readonly vaultsService: VaultsService
  ) {}

  public async createVaultFolder(
    accountId: string,
    vaultId: string,
    options: CreateVaultFolderOptions
  ) {
    const [account, vault] = await Promise.all([
      this.accountsService.getAccount({ id: accountId }),
      this.vaultsService.getVault({ id: vaultId }),
    ]);

    if (!account) throw new ApiNotFoundException('The account was not found');

    if (!vault) throw new ApiNotFoundException('The vault was not found');

    return this.foldersRepository.save(
      this.foldersRepository.create({
        encOverview: options.encOverview,
        vaultId: vault.id,
        creatorAccountId: account.id,
        parentFolderId: options.parentFolderUuid,
      })
    );
  }

  public format(entity: VaultFolderEntity): VaultFolder {
    return this.normalize(entity);
  }

  public formatAll(entities: VaultFolderEntity[]): VaultFolder[] {
    return entities.map(e => this.normalize(e));
  }

  public normalize(entity: VaultFolderEntity): VaultFolder {
    return {
      uuid: entity?.id,
      encOverview: entity?.encOverview,
      parentFolderUuid: entity?.parentFolderId,
      vaultUuid: entity?.vaultId,
      creatorAccountUuid: entity?.creatorAccountId,
      lastUpdatedAt: entity?.updatedAt.toISOString(),
      createdAt: entity?.createdAt.toISOString(),
    };
  }

  public getVaultFolders(
    options: FindVaultFoldersOptions
  ): Promise<VaultFolderEntity[]> {
    return this.foldersRepository.find({
      select: [
        'id',
        'encOverview',
        'parentFolderId',
        'vaultId',
        'creatorAccountId',
        'updatedAt',
        'createdAt',
      ],
      where: {
        ...options,
        isDeleted: false,
      },
    });
  }

  public getVaultFolder(
    options: FindVaultFoldersOptions
  ): Promise<VaultFolderEntity> {
    return this.foldersRepository.findOne({
      select: [
        'id',
        'encOverview',
        'parentFolderId',
        'vaultId',
        'creatorAccountId',
        'updatedAt',
        'createdAt',
      ],
      where: {
        ...options,
        isDeleted: false,
      },
    });
  }
}

export default VaultFoldersService;
