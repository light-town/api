import faker from 'faker';
import { DeepPartial } from 'typeorm';
import VaultEntity from '~/db/entities/vault.entity';
import KeySetObjectsService from '~/modules/key-set-objects/key-set-objects.service';
import KeySetsService from '~/modules/key-sets/key-sets.service';
import VaultsController from '../vaults.controller';
import VaultsService from '../vaults.service';
import createModuleHelper from './helpers/create-module.helper';

describe('[Vaults Module] [Controller] ...', () => {
  let keySetsService: KeySetsService;
  let vaultsService: VaultsService;
  let vaultsController: VaultsController;
  let keySetObjectsService: KeySetObjectsService;

  beforeAll(async () => {
    const app = await createModuleHelper();

    keySetsService = app.get<KeySetsService>(KeySetsService);
    vaultsService = app.get<VaultsService>(VaultsService);
    vaultsController = app.get<VaultsController>(VaultsController);
    keySetObjectsService = app.get<KeySetObjectsService>(KeySetObjectsService);
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
        creatorAccountId: TEST_ACCOUNT.id,
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
          accountId: TEST_ACCOUNT.id,
          keySetId: faker.datatype.uuid(),
        },
        {
          id: faker.datatype.uuid(),
          encKey: faker.random.word(),
          encOverview: faker.random.word(),
          accountId: TEST_ACCOUNT.id,
          keySetId: faker.datatype.uuid(),
        },
        {
          id: faker.datatype.uuid(),
          encKey: faker.random.word(),
          encOverview: faker.random.word(),
          accountId: TEST_ACCOUNT.id,
          keySetId: faker.datatype.uuid(),
        },
      ];
      const TEST_KEY_SETS = [
        { keySetId: TEST_VAULTS[0].keySetId },
        { keySetId: TEST_VAULTS[1].keySetId },
        { keySetId: TEST_VAULTS[2].keySetId },
      ];

      jest
        .spyOn(keySetObjectsService, 'getKeySetObjects')
        .mockResolvedValueOnce(<any>TEST_KEY_SETS);

      jest
        .spyOn(vaultsService, 'getVault')
        .mockResolvedValueOnce(<any>TEST_VAULTS[0])
        .mockResolvedValueOnce(<any>TEST_VAULTS[1])
        .mockResolvedValueOnce(<any>TEST_VAULTS[2]);

      expect(await vaultsController.getVaults(TEST_ACCOUNT)).toStrictEqual(
        TEST_VAULTS.map(v =>
          vaultsService.format(<any>v, v.accountId, v.keySetId)
        )
      );

      expect(
        jest.spyOn(keySetObjectsService, 'getKeySetObjects')
      ).toHaveBeenCalledTimes(1);

      expect(
        jest.spyOn(keySetObjectsService, 'getKeySetObjects')
      ).toHaveBeenCalledWith({
        creatorAccountId: TEST_ACCOUNT.id,
        isVault: true,
      });
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
