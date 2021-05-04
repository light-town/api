import { TestingModule } from '@nestjs/testing';
import faker from 'faker';
import KeySetsController from '../key-sets.controller';
import KeySetsService from '../key-sets.service';
import createModuleHelper from './helpers/create-module.helper';

describe('[Key Set Module] [Controller] ...', () => {
  let moduleFixture: TestingModule;
  let keySetsService: KeySetsService;
  let keySetsController: KeySetsController;

  beforeAll(async () => {
    moduleFixture = await createModuleHelper();

    keySetsService = moduleFixture.get<KeySetsService>(KeySetsService);
    keySetsController = moduleFixture.get<KeySetsController>(KeySetsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Getting key sets', () => {
    it('should return all key sets of the account', async () => {
      const ACCOUNT_UUID = faker.datatype.uuid();
      const KEY_SETS = [
        {
          id: faker.datatype.uuid(),
          creatorAccountId: faker.datatype.uuid(),
          ownerAccountId: faker.datatype.uuid(),
          ownerTeamId: null,
          publicKey: faker.datatype.uuid(),
          encPrivateKey: {
            key: faker.datatype.uuid(),
          },
          encSymmetricKey: {
            key: faker.datatype.uuid(),
          },
          isPrimary: false,
        },
      ];
      const IS_PRIMARY = false;

      const getKeySetFn = jest
        .spyOn(keySetsService, 'getKeySets')
        .mockResolvedValueOnce(<any>KEY_SETS);

      expect(
        await keySetsController.getKeySets(
          { id: ACCOUNT_UUID },
          IS_PRIMARY.toString()
        )
      ).toStrictEqual(
        KEY_SETS.map(keySet => ({
          uuid: keySet.id,
          creatorAccountUuid: keySet.creatorAccountId,
          ownerAccountUuid: keySet.ownerAccountId,
          ownerTeamUuid: keySet.ownerTeamId,
          publicKey: keySet.publicKey,
          encPrivateKey: keySet.encPrivateKey,
          encSymmetricKey: keySet.encSymmetricKey,
          isPrimary: keySet.isPrimary,
        }))
      );

      expect(getKeySetFn).toHaveBeenCalledTimes(1);
      expect(getKeySetFn).toHaveBeenCalledWith({
        ownerAccountId: ACCOUNT_UUID,
      });
    });

    it('should return the primary key set of the account', async () => {
      const ACCOUNT_UUID = faker.datatype.uuid();
      const KEY_SETS = [
        {
          id: faker.datatype.uuid(),
          creatorAccountId: faker.datatype.uuid(),
          ownerAccountId: faker.datatype.uuid(),
          ownerTeamId: null,
          publicKey: faker.datatype.uuid(),
          encPrivateKey: {
            key: faker.datatype.uuid(),
          },
          encSymmetricKey: {
            key: faker.datatype.uuid(),
          },
          isPrimary: false,
        },
      ];
      const IS_PRIMARY = true;

      const getKeySetFn = jest
        .spyOn(keySetsService, 'getKeySets')
        .mockResolvedValueOnce(<any>KEY_SETS);

      expect(
        await keySetsController.getKeySets(
          { id: ACCOUNT_UUID },
          IS_PRIMARY.toString()
        )
      ).toStrictEqual(
        KEY_SETS.map(keySet => ({
          uuid: keySet.id,
          creatorAccountUuid: keySet.creatorAccountId,
          ownerAccountUuid: keySet.ownerAccountId,
          ownerTeamUuid: keySet.ownerTeamId,
          publicKey: keySet.publicKey,
          encPrivateKey: keySet.encPrivateKey,
          encSymmetricKey: keySet.encSymmetricKey,
          isPrimary: keySet.isPrimary,
        }))
      );

      expect(getKeySetFn).toHaveBeenCalledTimes(1);
      expect(getKeySetFn).toHaveBeenCalledWith({
        ownerAccountId: ACCOUNT_UUID,
        isPrimary: IS_PRIMARY,
      });
    });
  });
});
