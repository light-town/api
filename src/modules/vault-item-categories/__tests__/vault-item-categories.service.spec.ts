import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as faker from 'faker';
import { Repository } from 'typeorm';
import VaultsService from '~/modules/vaults/vaults.service';
import createModuleHelper from './helpers/create-module.helper';
import core from '@light-town/core';
import AccountsService from '~/modules/accounts/accounts.service';
import VaultItemCategoriesService from '../vault-item-categories.service';
import VaultItemCategoryEntity from '~/db/entities/vault-item-category.entity';

describe('[Vault Item Categories Module] [Service] ...', () => {
  let moduleFixture: TestingModule;

  let vaultsService: VaultsService;
  let accountsService: AccountsService;

  let vaultItemCategoriesService: VaultItemCategoriesService;
  let vaultItemCategoriesRepository: Repository<VaultItemCategoryEntity>;

  beforeAll(async () => {
    moduleFixture = await createModuleHelper();

    vaultsService = moduleFixture.get<VaultsService>(VaultsService);
    accountsService = moduleFixture.get<AccountsService>(AccountsService);

    vaultItemCategoriesService = moduleFixture.get<VaultItemCategoriesService>(
      VaultItemCategoriesService
    );
    vaultItemCategoriesRepository = moduleFixture.get<
      Repository<VaultItemCategoryEntity>
    >(getRepositoryToken(VaultItemCategoryEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('[Creating] ...', () => {
    it('create vault item category', async () => {
      const TEST_ACCOUNT = { id: faker.datatype.uuid() };
      const TEST_VAULT = {
        id: faker.datatype.uuid(),
        key: core.common.generateCryptoRandomString(32),
      };
      const TEST_VAULT_ITEM_CATEGORY = {
        id: faker.datatype.uuid(),
      };
      const TEST_ENC_OVERVIEW = {
        name: faker.random.word(),
      };

      jest
        .spyOn(accountsService, 'getAccount')
        .mockResolvedValueOnce(<any>TEST_ACCOUNT);
      jest
        .spyOn(vaultsService, 'getVault')
        .mockResolvedValueOnce(<any>TEST_VAULT);
      jest
        .spyOn(vaultItemCategoriesRepository, 'create')
        .mockImplementationOnce((f): any => f);
      jest
        .spyOn(vaultItemCategoriesRepository, 'save')
        .mockResolvedValueOnce(<any>TEST_VAULT_ITEM_CATEGORY);

      expect(
        await vaultItemCategoriesService.createVaultItemCategory(
          TEST_ACCOUNT.id,
          TEST_VAULT.id,
          {
            encOverview: TEST_ENC_OVERVIEW,
          }
        )
      ).toStrictEqual(TEST_VAULT_ITEM_CATEGORY);

      expect(accountsService.getAccount).toHaveBeenCalledTimes(1);
      expect(accountsService.getAccount).toHaveBeenCalledWith({
        id: TEST_ACCOUNT.id,
      });

      expect(vaultsService.getVault).toHaveBeenCalledTimes(1);
      expect(vaultsService.getVault).toHaveBeenCalledWith({
        id: TEST_VAULT.id,
      });

      expect(vaultItemCategoriesRepository.create).toHaveBeenCalledTimes(1);
      expect(vaultItemCategoriesRepository.create).toHaveBeenCalledWith({
        encOverview: TEST_ENC_OVERVIEW,
        vaultId: TEST_VAULT.id,
        creatorAccountId: TEST_ACCOUNT.id,
      });

      expect(vaultItemCategoriesRepository.save).toHaveBeenCalledTimes(1);
      expect(vaultItemCategoriesRepository.save).toHaveBeenCalledWith({
        encOverview: TEST_ENC_OVERVIEW,
        vaultId: TEST_VAULT.id,
        creatorAccountId: TEST_ACCOUNT.id,
      });
    });
  });
});
