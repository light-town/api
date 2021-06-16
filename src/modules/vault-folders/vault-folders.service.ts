import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ApiNotFoundException } from '~/common/exceptions';
import VaultFolderEntity from '~/db/entities/vault-folder.entity';
import AccountsService from '../accounts/accounts.service';
import VaultsService from '../vaults/vaults.service';
import { CreateVaultFolderOptions, VaultFolder } from './vault-folders.dto';

export interface FindVaultFoldersOptions {
  id?: string;
  vaultId?: string;
  vaultIds?: string[];
  creatorAccountId?: string;
  root?: boolean;
  parentFolderId?: string;
}

@Injectable()
export class VaultFoldersService {
  public constructor(
    @InjectRepository(VaultFolderEntity)
    private readonly foldersRepository: Repository<VaultFolderEntity>,
    private readonly accountsService: AccountsService,
    @Inject(forwardRef(() => VaultsService))
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

    return {
      ...(await this.foldersRepository.save(
        this.foldersRepository.create({
          encOverview: options.encOverview,
          vaultId: vault.id,
          creatorAccountId: account.id,
          parentFolderId: options.parentFolderUuid,
        })
      )),
      containedFoldersCount: 0,
    };
  }

  public format(entity: VaultFolderEntity): VaultFolder {
    return this.normalize(entity);
  }

  public formatAll(entities: VaultFolderEntity[]): VaultFolder[] {
    return entities.map(e => this.normalize(e));
  }

  public normalize(entity: any): VaultFolder {
    if (!entity) return;

    return {
      uuid: entity?.id,
      encOverview: entity?.encOverview,
      parentFolderUuid: entity?.parentFolderId,
      vaultUuid: entity?.vaultId,
      creatorAccountUuid: entity?.creatorAccountId,
      lastUpdatedAt: entity?.updatedAt.toISOString(),
      createdAt: entity?.createdAt.toISOString(),
      containedFoldersCount: Number.parseInt(entity.containedFoldersCount),
    };
  }

  public async getVaultFoldersCount(
    options: FindVaultFoldersOptions
  ): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getCount();
  }

  public async getVaultFolders(
    options: FindVaultFoldersOptions
  ): Promise<VaultFolderEntity[]> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getRawMany();
  }

  public getVaultFolder(
    options: FindVaultFoldersOptions
  ): Promise<VaultFolderEntity> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, query] = this.prepareQuery(options);
    return query.getRawOne();
  }

  public prepareQuery(
    options: FindVaultFoldersOptions
  ): [string, SelectQueryBuilder<VaultFolderEntity>] {
    const alias = 'folders';
    const query = this.foldersRepository
      .createQueryBuilder(alias)
      .select('folders.id', 'id')
      .addSelect('folders.encOverview', 'encOverview')
      .addSelect('folders.parentFolderId', 'parentFolderId')
      .addSelect('folders.vaultId', 'vaultId')
      .addSelect('folders.creatorAccountId', 'creatorAccountId')
      .addSelect('folders.updatedAt', 'updatedAt')
      .addSelect('folders.createdAt', 'createdAt')
      .where(`${alias}.is_deleted = :isDeleted`, { isDeleted: false });

    query.addSelect(qb => {
      return qb
        .subQuery()
        .select('COUNT(f.id)', 'containedFoldersCount')
        .where('f.parentFolderId = folders.id')
        .from(VaultFolderEntity, 'f');
    });

    query.addSelect(qb => {
      return qb
        .subQuery()
        .select('COUNT(f.id)', 'containedFoldersCount')
        .where('f.parentFolderId = folders.id')
        .from(VaultFolderEntity, 'f');
    });

    if (options.hasOwnProperty('id'))
      query.andWhere(`${alias}.id = :id`, options);

    if (options.hasOwnProperty('parentFolderId'))
      query.andWhere(`${alias}.parent_folder_id = :parentFolderId`, options);

    if (options.hasOwnProperty('creatorAccountId'))
      query.andWhere(`${alias}.creator_accountId = :creatorAccountId`, options);

    if (options.hasOwnProperty('vaultId'))
      query.andWhere(`${alias}.vault_id = :vaultId`, options);

    if (options.hasOwnProperty('vaultIds'))
      query.andWhere(`${alias}.vault_id IN (:...vaultIds)`, options);

    if (options.hasOwnProperty('root'))
      query.andWhere(`${alias}.parent_folder_id IS NULL`);

    return [alias, query];
  }

  public async deleteVaultFolder(id: string): Promise<void> {
    await this.foldersRepository.update({ id }, { isDeleted: true });
  }
}

export default VaultFoldersService;
