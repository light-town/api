import faker from 'faker';
import { DeepPartial } from 'typeorm';
import VaultEntity from '~/db/entities/vault.entity';
import KeySetsService from '~/modules/key-sets/key-sets.service';
import VaultsController from '../vaults.controller';
import VaultsService from '../vaults.service';
import createModuleHelper from './helpers/create-module.helper';

describe('[Vaults Module] [Controller] ...', () => {
  let keySetsService: KeySetsService;
  let vaultsService: VaultsService;
  let vaultsController: VaultsController;

  beforeAll(async () => {
    const app = await createModuleHelper();

    keySetsService = app.get<KeySetsService>(KeySetsService);
    vaultsService = app.get<VaultsService>(VaultsService);
    vaultsController = app.get<VaultsController>(VaultsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('[Creating] ...', () => {
    it('should create vault', async () => {
      const TEST_ACCOUNT = { id: faker.datatype.uuid() };
      const TEST_CREATE_VAULT_PAYLOAD = {
        encKey: {
          kty: faker.random.word(),
          alg: faker.random.word(),
          key: faker.random.word(),
        },
        encOverview: {},
      };
      const TEST_VAULT: DeepPartial<VaultEntity> = {
        id: faker.datatype.uuid(),
        encKey: TEST_CREATE_VAULT_PAYLOAD.encKey,
        encOverview: TEST_CREATE_VAULT_PAYLOAD.encOverview,
      };
      const TEST_KEY_SET = { id: faker.datatype.uuid() };

      jest
        .spyOn(vaultsService, 'create')
        .mockResolvedValueOnce(<any>TEST_VAULT);

      jest
        .spyOn(keySetsService, 'getKeySet')
        .mockResolvedValueOnce(<any>TEST_KEY_SET);

      expect(
        await vaultsController.createVault(
          TEST_ACCOUNT,
          <any>TEST_CREATE_VAULT_PAYLOAD
        )
      ).toStrictEqual({
        uuid: TEST_VAULT.id,
        encKey: TEST_VAULT.encKey,
        encOverview: TEST_VAULT.encOverview,
        accountUuid: TEST_ACCOUNT.id,
        keySetUuid: TEST_KEY_SET.id,
      });

      expect(vaultsService.create).toHaveBeenCalledTimes(1);
      expect(vaultsService.create).toHaveBeenCalledWith(
        TEST_ACCOUNT.id,
        TEST_CREATE_VAULT_PAYLOAD
      );

      expect(keySetsService.getKeySet).toHaveBeenCalledTimes(1);
      expect(keySetsService.getKeySet).toHaveBeenCalledWith({
        ownerAccountId: TEST_ACCOUNT.id,
        isPrimary: true,
      });
    });
  });

  describe('[Getting] ...', () => {
    it('should return all vaults', async () => {
      const TEST_ACCOUNT = { id: faker.datatype.uuid() };
      const TEST_VAULTS = [
        {
          id: faker.datatype.uuid(),
          encKey: faker.random.word(),
          encOverview: faker.random.word(),
        },
        {
          id: faker.datatype.uuid(),
          encKey: faker.random.word(),
          encOverview: faker.random.word(),
        },
        {
          id: faker.datatype.uuid(),
          encKey: faker.random.word(),
          encOverview: faker.random.word(),
        },
      ];
      const TEST_KEY_SETS = [
        { id: faker.datatype.uuid() },
        { id: faker.datatype.uuid() },
        { id: faker.datatype.uuid() },
      ];

      jest
        .spyOn(keySetsService, 'getKeySets')
        .mockResolvedValueOnce(<any>TEST_KEY_SETS);

      jest
        .spyOn(vaultsService, 'getVaultsByKeySet')
        .mockResolvedValueOnce(<any>TEST_VAULTS)
        .mockResolvedValueOnce(<any>TEST_VAULTS)
        .mockResolvedValueOnce(<any>TEST_VAULTS);

      expect(await vaultsController.getVaults(TEST_ACCOUNT)).toStrictEqual(
        TEST_KEY_SETS.reduce(
          (prev, val) => [
            ...prev,
            ...TEST_VAULTS.map(v => ({
              uuid: v.id,
              encKey: v.encKey,
              encOverview: v.encOverview,
              accountUuid: TEST_ACCOUNT.id,
              keySetUuid: val.id,
            })),
          ],
          []
        )
      );

      expect(
        jest.spyOn(vaultsService, 'getVaultsByKeySet')
      ).toHaveBeenCalledTimes(3);
      expect(
        jest.spyOn(vaultsService, 'getVaultsByKeySet')
      ).toHaveBeenNthCalledWith(1, TEST_KEY_SETS[0].id);
      expect(
        jest.spyOn(vaultsService, 'getVaultsByKeySet')
      ).toHaveBeenNthCalledWith(2, TEST_KEY_SETS[1].id);
      expect(
        jest.spyOn(vaultsService, 'getVaultsByKeySet')
      ).toHaveBeenNthCalledWith(3, TEST_KEY_SETS[2].id);
    });
  });

  describe('[Deleting] ...', () => {
    test.todo('should delete vault');
    /* it('should delete vault', async () => {
      const TEST_ACCOUNT_ID = faker.datatype.uuid();
      const TEST_VAULT_ID = faker.datatype.uuid();
      const TEST_KEY_SETS = [
        { id: faker.datatype.uuid() },
        { id: faker.datatype.uuid() },
        { id: faker.datatype.uuid() },
      ];

      jest
        .spyOn(keySetsService, 'getKeySets')
        .mockResolvedValueOnce(<any>TEST_KEY_SETS);

      jest.spyOn(keySetsService, 'deleteKeySet').mockResolvedValue();

      await vaultsController.deleteVault(TEST_ACCOUNT_ID, TEST_VAULT_ID);

      expect(jest.spyOn(keySetsService, 'deleteKeySet')).toHaveBeenCalledTimes(
        3
      );
      expect(
        jest.spyOn(keySetsService, 'deleteKeySet')
      ).toHaveBeenNthCalledWith(1, TEST_KEY_SETS[0].id);
      expect(
        jest.spyOn(keySetsService, 'deleteKeySet')
      ).toHaveBeenNthCalledWith(2, TEST_KEY_SETS[1].id);
      expect(
        jest.spyOn(keySetsService, 'deleteKeySet')
      ).toHaveBeenNthCalledWith(3, TEST_KEY_SETS[2].id);
    });*/
  });
});
