import { getRepositoryToken } from '@nestjs/typeorm';
import faker from 'faker';
import { DeepPartial, In, Repository } from 'typeorm';
import VaultEntity from '~/db/entities/vault.entity';
import KeySetVaultsService from '~/modules/key-set-vaults/key-set-vaults.service';
import KeySetsService from '~/modules/key-sets/key-sets.service';
import { CreateVaultPayload } from '../vaults.dto';
import VaultsService from '../vaults.service';
import createModuleHelper from './helpers/create-module.helper';

describe('[Vaults Module] [Service] ...', () => {
  let vaultsService: VaultsService;
  let keySetsService: KeySetsService;
  let keySetVaultsService: KeySetVaultsService;
  let vaultsRepository: Repository<VaultEntity>;

  beforeAll(async () => {
    const app = await createModuleHelper();

    keySetVaultsService = app.get<KeySetVaultsService>(KeySetVaultsService);
    vaultsService = app.get<VaultsService>(VaultsService);
    keySetsService = app.get<KeySetsService>(KeySetsService);
    vaultsRepository = app.get<Repository<VaultEntity>>(
      getRepositoryToken(VaultEntity)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('[Creating] ...', () => {
    it('should create vault', async () => {
      const TEST_ACCOUNT = {
        id: faker.datatype.uuid(),
      };
      const TEST_CREATE_VAULT_PAYLOAD: CreateVaultPayload = {
        encKey: {
          kty: faker.random.word(),
          alg: faker.random.word(),
          key: faker.random.word(),
        },
        encOverview: {},
        encCategories: [],
      };
      const TEST_VAULT: DeepPartial<VaultEntity> = {
        id: faker.datatype.uuid(),
        encKey: TEST_CREATE_VAULT_PAYLOAD.encKey,
        encOverview: TEST_CREATE_VAULT_PAYLOAD.encOverview,
      };
      const TEST_PRIMARY_KEY_SET = { id: faker.datatype.uuid() };

      jest
        .spyOn(vaultsRepository, 'create')
        .mockReturnValueOnce(<any>TEST_VAULT);

      jest
        .spyOn(keySetsService, 'getKeySet')
        .mockResolvedValueOnce(<any>TEST_PRIMARY_KEY_SET);

      jest
        .spyOn(vaultsRepository, 'save')
        .mockResolvedValueOnce(<any>TEST_VAULT);

      jest.spyOn(keySetVaultsService, 'create').mockResolvedValueOnce(<any>{});

      expect(
        await vaultsService.create(TEST_ACCOUNT.id, TEST_CREATE_VAULT_PAYLOAD)
      ).toStrictEqual(TEST_VAULT);

      expect(jest.spyOn(vaultsRepository, 'create')).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(vaultsRepository, 'create')).toHaveBeenCalledWith({
        encKey: TEST_CREATE_VAULT_PAYLOAD.encKey,
        encOverview: TEST_CREATE_VAULT_PAYLOAD.encOverview,
      });

      expect(jest.spyOn(vaultsRepository, 'save')).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(vaultsRepository, 'save')).toHaveBeenCalledWith(
        TEST_VAULT
      );
    });
  });

  describe('[Getting] ...', () => {
    it('should return all vaults', async () => {
      const TEST_PRIMARY_KEY_SET = faker.datatype.uuid();
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

      jest
        .spyOn(keySetVaultsService, 'getVaultIds')
        .mockResolvedValueOnce(TEST_VAULTS.map(v => v.id));

      jest.spyOn(vaultsService, 'find').mockResolvedValueOnce(<any>TEST_VAULTS);

      expect(
        await vaultsService.getVaultsByKeySet(TEST_PRIMARY_KEY_SET)
      ).toStrictEqual(TEST_VAULTS);

      expect(keySetVaultsService.getVaultIds).toHaveBeenCalledTimes(1);
      expect(keySetVaultsService.getVaultIds).toHaveBeenCalledWith(
        TEST_PRIMARY_KEY_SET
      );

      expect(vaultsService.find).toHaveBeenCalledTimes(1);
      expect(vaultsService.find).toHaveBeenCalledWith({
        select: ['id', 'encKey', 'encOverview'],
        where: {
          id: In(TEST_VAULTS.map(v => v.id)),
          isDeleted: false,
        },
      });
    });
  });
});
