import * as faker from 'faker';
import { DeepPartial } from 'typeorm';
import KeySetEntity from '~/db/entities/key-sets.entity';
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
      const TEST_ACCOUNT_ID = faker.datatype.uuid();
      const TEST_CREATE_VAULT_PAYLOAD = {
        keySet: {
          publicKey: faker.datatype.uuid(),
          encPrivateKey: faker.datatype.uuid(),
          encSymmetricKey: faker.datatype.uuid(),
        },
        vault: {
          encKey: {
            kty: faker.random.word(),
            alg: faker.random.word(),
            key: faker.random.word(),
          },
          encMetadata: {},
        },
      };
      const TEST_VAULT: DeepPartial<VaultEntity> = {
        id: faker.datatype.uuid(),
        encKey: TEST_CREATE_VAULT_PAYLOAD.vault.encKey,
        encMetadata: TEST_CREATE_VAULT_PAYLOAD.vault.encMetadata,
      };
      const TEST_KEY_SET: DeepPartial<KeySetEntity> = {
        id: faker.datatype.uuid(),
        publicKey: TEST_CREATE_VAULT_PAYLOAD.keySet.publicKey,
        encPrivateKey: <any>TEST_CREATE_VAULT_PAYLOAD.keySet.encPrivateKey,
        encSymmetricKey: <any>TEST_CREATE_VAULT_PAYLOAD.keySet.encSymmetricKey,
      };

      jest
        .spyOn(vaultsService, 'create')
        .mockResolvedValueOnce(<any>TEST_VAULT);

      jest
        .spyOn(keySetsService, 'create')
        .mockResolvedValueOnce(<any>TEST_KEY_SET);

      expect(
        await vaultsController.createVault(
          TEST_ACCOUNT_ID,
          <any>TEST_CREATE_VAULT_PAYLOAD
        )
      ).toStrictEqual({
        uuid: TEST_VAULT.id,
        encKey: TEST_VAULT.encKey,
        encMetadata: TEST_VAULT.encMetadata,
      });

      expect(jest.spyOn(vaultsService, 'create')).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(vaultsService, 'create')).toHaveBeenCalledWith(
        TEST_CREATE_VAULT_PAYLOAD.vault
      );

      expect(jest.spyOn(keySetsService, 'create')).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(keySetsService, 'create')).toHaveBeenCalledWith(
        TEST_ACCOUNT_ID,
        TEST_VAULT.id,
        TEST_CREATE_VAULT_PAYLOAD.keySet
      );
    });
  });

  describe('[Getting] ...', () => {
    it('should return all vaults', async () => {
      const TEST_ACCOUNT_ID = faker.datatype.uuid();
      const TEST_VAULTS = [
        {
          id: faker.datatype.uuid(),
          encKey: faker.random.word(),
          encMetadata: faker.random.word(),
        },
        {
          id: faker.datatype.uuid(),
          encKey: faker.random.word(),
          encMetadata: faker.random.word(),
        },
        {
          id: faker.datatype.uuid(),
          encKey: faker.random.word(),
          encMetadata: faker.random.word(),
        },
      ];

      jest
        .spyOn(vaultsService, 'getVaults')
        .mockResolvedValueOnce(<any>TEST_VAULTS);

      jest.spyOn(vaultsService, 'find').mockResolvedValueOnce(<any>TEST_VAULTS);

      expect(await vaultsController.getVaults(TEST_ACCOUNT_ID)).toStrictEqual(
        TEST_VAULTS.map(v => ({
          uuid: v.id,
          encKey: v.encKey,
          encMetadata: v.encMetadata,
        }))
      );

      expect(jest.spyOn(vaultsService, 'getVaults')).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(vaultsService, 'getVaults')).toHaveBeenCalledWith(
        TEST_ACCOUNT_ID
      );
    });
  });

  describe('[Deleting] ...', () => {
    it('should delete vault', async () => {
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

      expect(jest.spyOn(keySetsService, 'getKeySets')).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(keySetsService, 'getKeySets')).toHaveBeenCalledWith({
        vaultId: TEST_VAULT_ID,
      });

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
    });
  });
});
