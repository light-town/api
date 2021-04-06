import { getRepositoryToken } from '@nestjs/typeorm';
import * as faker from 'faker';
import { DeepPartial, In, Repository } from 'typeorm';
import VaultEntity from '~/db/entities/vault.entity';
import KeySetsService from '~/modules/key-sets/key-sets.service';
import { CreateVaultPayload } from '../vaults.dto';
import VaultsService from '../vaults.service';
import createModuleHelper from './helpers/create-module.helper';

describe('[Vaults Module] [Service] ...', () => {
  let keySetsService: KeySetsService;
  let vaultsService: VaultsService;
  let vaultsRepository: Repository<VaultEntity>;

  beforeAll(async () => {
    const app = await createModuleHelper();

    keySetsService = app.get<KeySetsService>(KeySetsService);
    vaultsService = app.get<VaultsService>(VaultsService);
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
      const TEST_CREATE_VAULT_PAYLOAD: CreateVaultPayload = {
        encKey: {
          kty: faker.random.word(),
          alg: faker.random.word(),
          key: faker.random.word(),
        },
        encMetadata: {},
      };
      const TEST_VAULT: DeepPartial<VaultEntity> = {
        id: faker.datatype.uuid(),
        encKey: TEST_CREATE_VAULT_PAYLOAD.encKey,
        encMetadata: TEST_CREATE_VAULT_PAYLOAD.encMetadata,
      };

      jest
        .spyOn(vaultsRepository, 'create')
        .mockReturnValueOnce(<any>TEST_VAULT);

      jest.spyOn(vaultsRepository, 'save').mockReturnValueOnce(<any>TEST_VAULT);

      expect(
        await vaultsService.create(TEST_CREATE_VAULT_PAYLOAD)
      ).toStrictEqual(TEST_VAULT);

      expect(jest.spyOn(vaultsRepository, 'create')).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(vaultsRepository, 'create')).toHaveBeenCalledWith({
        encKey: TEST_CREATE_VAULT_PAYLOAD.encKey,
        encMetadata: TEST_CREATE_VAULT_PAYLOAD.encMetadata,
      });

      expect(jest.spyOn(vaultsRepository, 'save')).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(vaultsRepository, 'save')).toHaveBeenCalledWith(
        TEST_VAULT
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
        .spyOn(keySetsService, 'getVaultIds')
        .mockResolvedValueOnce(TEST_VAULTS.map(v => v.id));

      jest.spyOn(vaultsService, 'find').mockResolvedValueOnce(<any>TEST_VAULTS);

      expect(await vaultsService.getVaults(TEST_ACCOUNT_ID)).toStrictEqual(
        TEST_VAULTS
      );

      expect(jest.spyOn(keySetsService, 'getVaultIds')).toHaveBeenCalledTimes(
        1
      );
      expect(jest.spyOn(keySetsService, 'getVaultIds')).toHaveBeenCalledWith(
        TEST_ACCOUNT_ID
      );

      expect(jest.spyOn(vaultsService, 'find')).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(vaultsService, 'find')).toHaveBeenCalledWith({
        select: ['id', 'encKey', 'encMetadata'],
        where: {
          id: In(TEST_VAULTS.map(v => v.id)),
          isDeleted: false,
        },
      });
    });
  });
});
