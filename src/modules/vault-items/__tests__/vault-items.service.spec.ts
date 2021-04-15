import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as faker from 'faker';
import { Repository } from 'typeorm';
import VaultItemEntity from '~/db/entities/vault-item.entity';
import VaultsService from '~/modules/vaults/vaults.service';
import VaultItemsService from '../vault-items.service';
import createModuleHelper from './helpers/create-module.helper';
import core from '@light-town/core';
import AccountsService from '~/modules/accounts/accounts.service';
import VaultFoldersService from '~/modules/vault-folders/vault-folders.service';
import VaultItemCategoriesService from '~/modules/vault-item-categories/vault-item-categories.service';

describe('[Vault Items Module] [Service] ...', () => {
  let moduleFixture: TestingModule;

  let vaultsService: VaultsService;
  let accountsService: AccountsService;
  let vaultFoldersService: VaultFoldersService;
  let vaultItemCategoriesService: VaultItemCategoriesService;

  let vaultItemsService: VaultItemsService;
  let vaultItemsRepository: Repository<VaultItemEntity>;

  beforeAll(async () => {
    moduleFixture = await createModuleHelper();

    vaultsService = moduleFixture.get<VaultsService>(VaultsService);
    accountsService = moduleFixture.get<AccountsService>(AccountsService);
    vaultItemCategoriesService = moduleFixture.get<VaultItemCategoriesService>(
      VaultItemCategoriesService
    );
    vaultFoldersService = moduleFixture.get<VaultFoldersService>(
      VaultFoldersService
    );

    vaultItemsService = moduleFixture.get<VaultItemsService>(VaultItemsService);
    vaultItemsRepository = moduleFixture.get<Repository<VaultItemEntity>>(
      getRepositoryToken(VaultItemEntity)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('[Creating] ...', () => {
    it('create vault item', async () => {
      const TEST_ACCOUNT = { id: faker.datatype.uuid() };
      const TEST_VAULT = {
        id: faker.datatype.uuid(),
        key: core.common.generateCryptoRandomString(32),
      };
      const TEST_VAULT_ITEM = {
        id: faker.datatype.uuid(),
      };
      const TEST_VAULT_FOLDER = {
        id: faker.datatype.uuid(),
      };
      const TEST_VAULT_ITEM_CATEGORY = {
        id: faker.datatype.uuid(),
      };
      const TEST_PAYLOAD = await core.vaults.vaultItem.encryptVaultItem(
        {
          title: 'Google Drive',
          urls: [
            faker.internet.url(),
            faker.internet.url(),
            faker.internet.url(),
          ],
        },
        {
          fields: [
            {
              name: 'username',
              type: 'TEXT',
              value: faker.internet.userName(),
            },
            {
              name: 'password',
              type: 'PASSWORD',
              value: faker.internet.password(),
            },
          ],
        },
        TEST_VAULT.key
      );

      jest
        .spyOn(accountsService, 'getAccount')
        .mockResolvedValueOnce(<any>TEST_ACCOUNT);

      jest
        .spyOn(vaultsService, 'getVault')
        .mockResolvedValueOnce(<any>TEST_VAULT);

      jest
        .spyOn(vaultFoldersService, 'getVaultFolder')
        .mockResolvedValueOnce(<any>TEST_VAULT_FOLDER);

      jest
        .spyOn(vaultItemCategoriesService, 'getVaultItemCategory')
        .mockResolvedValueOnce(<any>TEST_VAULT_ITEM_CATEGORY);

      jest
        .spyOn(vaultItemsRepository, 'create')
        .mockImplementationOnce((i): any => i);

      jest
        .spyOn(vaultItemsRepository, 'save')
        .mockResolvedValueOnce(<any>TEST_VAULT_ITEM);

      const vaultItem = await vaultItemsService.create(
        TEST_ACCOUNT.id,
        TEST_VAULT.id,
        TEST_VAULT_FOLDER.id,
        { ...TEST_PAYLOAD, categoryId: TEST_VAULT_ITEM_CATEGORY.id }
      );

      expect(vaultItem).toStrictEqual(TEST_VAULT_ITEM);

      expect(accountsService.getAccount).toHaveBeenCalledTimes(1);
      expect(accountsService.getAccount).toHaveBeenCalledWith({
        id: TEST_ACCOUNT.id,
      });

      expect(vaultsService.getVault).toHaveBeenCalledTimes(1);
      expect(vaultsService.getVault).toHaveBeenCalledWith({
        id: TEST_VAULT.id,
      });

      expect(vaultItemsRepository.create).toHaveBeenCalledTimes(1);
      expect(vaultItemsRepository.create).toHaveBeenCalledWith({
        encOverview: TEST_PAYLOAD.encOverview,
        encDetails: TEST_PAYLOAD.encDetails,
        vaultId: TEST_VAULT.id,
        creatorAccountId: TEST_ACCOUNT.id,
        folderId: TEST_VAULT_FOLDER.id,
        categoryId: TEST_VAULT_ITEM_CATEGORY.id,
      });

      expect(vaultItemsRepository.save).toHaveBeenCalledTimes(1);
      expect(vaultItemsRepository.save).toHaveBeenCalledWith({
        encOverview: TEST_PAYLOAD.encOverview,
        encDetails: TEST_PAYLOAD.encDetails,
        creatorAccountId: TEST_ACCOUNT.id,
        vaultId: TEST_VAULT.id,
        folderId: TEST_VAULT_FOLDER.id,
        categoryId: TEST_VAULT_ITEM_CATEGORY.id,
      });
    });
  });
});
