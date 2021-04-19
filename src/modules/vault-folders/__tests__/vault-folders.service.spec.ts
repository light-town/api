import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as faker from 'faker';
import { Repository } from 'typeorm';
import VaultsService from '~/modules/vaults/vaults.service';
import createModuleHelper from './helpers/create-module.helper';
import core from '@light-town/core';
import AccountsService from '~/modules/accounts/accounts.service';
import VaultFoldersService from '../vault-folders.service';
import VaultFolderEntity from '~/db/entities/vault-folder.entity';

describe('[Vault Folders Module] [Service] ...', () => {
  let moduleFixture: TestingModule;

  let vaultsService: VaultsService;
  let accountsService: AccountsService;

  let vaultFoldersService: VaultFoldersService;
  let vaultFoldersRepository: Repository<VaultFolderEntity>;

  beforeAll(async () => {
    moduleFixture = await createModuleHelper();

    vaultsService = moduleFixture.get<VaultsService>(VaultsService);
    accountsService = moduleFixture.get<AccountsService>(AccountsService);

    vaultFoldersService = moduleFixture.get<VaultFoldersService>(
      VaultFoldersService
    );
    vaultFoldersRepository = moduleFixture.get<Repository<VaultFolderEntity>>(
      getRepositoryToken(VaultFolderEntity)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('[Creating] ...', () => {
    it('create vault folder', async () => {
      const TEST_ACCOUNT = { id: faker.datatype.uuid() };
      const TEST_VAULT = {
        id: faker.datatype.uuid(),
        key: core.encryption.common.generateCryptoRandomString(32),
      };
      const TEST_VAULT_FOLDER = {
        id: faker.datatype.uuid(),
      };
      const TEST_ENC_OVERVIEW = {
        name: faker.random.word(),
      };
      const TEST_PARENT_FOLDER = null;

      jest
        .spyOn(accountsService, 'getAccount')
        .mockResolvedValueOnce(<any>TEST_ACCOUNT);
      jest
        .spyOn(vaultsService, 'getVault')
        .mockResolvedValueOnce(<any>TEST_VAULT);
      jest
        .spyOn(vaultFoldersRepository, 'create')
        .mockImplementationOnce((f): any => f);
      jest
        .spyOn(vaultFoldersRepository, 'save')
        .mockResolvedValueOnce(<any>TEST_VAULT_FOLDER);

      expect(
        await vaultFoldersService.createVaultFolder(
          TEST_ACCOUNT.id,
          TEST_VAULT.id,
          {
            encOverview: TEST_ENC_OVERVIEW,
            parentFolderUuid: TEST_PARENT_FOLDER,
          }
        )
      ).toStrictEqual(TEST_VAULT_FOLDER);

      expect(accountsService.getAccount).toHaveBeenCalledTimes(1);
      expect(accountsService.getAccount).toHaveBeenCalledWith({
        id: TEST_ACCOUNT.id,
      });

      expect(vaultsService.getVault).toHaveBeenCalledTimes(1);
      expect(vaultsService.getVault).toHaveBeenCalledWith({
        id: TEST_VAULT.id,
      });

      expect(vaultFoldersRepository.create).toHaveBeenCalledTimes(1);
      expect(vaultFoldersRepository.create).toHaveBeenCalledWith({
        encOverview: TEST_ENC_OVERVIEW,
        vaultId: TEST_VAULT.id,
        creatorAccountId: TEST_ACCOUNT.id,
        parentFolderId: TEST_PARENT_FOLDER,
      });

      expect(vaultFoldersRepository.save).toHaveBeenCalledTimes(1);
      expect(vaultFoldersRepository.save).toHaveBeenCalledWith({
        encOverview: TEST_ENC_OVERVIEW,
        vaultId: TEST_VAULT.id,
        creatorAccountId: TEST_ACCOUNT.id,
        parentFolderId: TEST_PARENT_FOLDER,
      });
    });
  });
});
