import { TestingModule } from '@nestjs/testing';
import * as faker from 'faker';
import KeySetsController from '../key-sets.controller';
import KeySetsService from '../key-sets.service';
import createTestingModule from './helpers/createTestingModule';

describe('[Key Set Module] [Controller] ...', () => {
  let moduleFixture: TestingModule;
  let keySetsService: KeySetsService;
  let keySetsController: KeySetsController;

  beforeAll(async () => {
    moduleFixture = await createTestingModule();

    keySetsService = moduleFixture.get<KeySetsService>(KeySetsService);
    keySetsController = moduleFixture.get<KeySetsController>(KeySetsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Getting key sets', () => {
    it('should return primary key set', async () => {
      const TEST_ACCOUNT_UUID = faker.datatype.uuid();
      const TEST_KEY_SET = {
        id: faker.datatype.uuid(),
        publicKey: faker.datatype.uuid(),
        encPrivateKey: <any>{
          key: faker.datatype.uuid(),
        },
        encSymmetricKey: <any>{
          key: faker.datatype.uuid(),
        },
      };

      const getPrimaryKeySetFn = jest
        .spyOn(keySetsService, 'getPrimaryKeySet')
        .mockResolvedValueOnce(<any>TEST_KEY_SET);

      expect(
        await keySetsController.getKeySets(TEST_ACCOUNT_UUID, true)
      ).toStrictEqual([TEST_KEY_SET]);

      expect(getPrimaryKeySetFn).toHaveBeenCalledTimes(1);
      expect(getPrimaryKeySetFn).toHaveBeenCalledWith(TEST_ACCOUNT_UUID);
    });

    it('should return all key sets', async () => {
      const TEST_ACCOUNT_UUID = faker.datatype.uuid();
      const TEST_KEY_SETS = [
        {
          id: faker.datatype.uuid(),
          publicKey: faker.datatype.uuid(),
          encPrivateKey: <any>{
            key: faker.datatype.uuid(),
          },
          encSymmetricKey: <any>{
            key: faker.datatype.uuid(),
          },
        },
      ];

      const getKeySetsFn = jest
        .spyOn(keySetsService, 'getKeySets')
        .mockResolvedValueOnce(<any>TEST_KEY_SETS);

      expect(
        await keySetsController.getKeySets(TEST_ACCOUNT_UUID, false)
      ).toStrictEqual(TEST_KEY_SETS);

      expect(getKeySetsFn).toHaveBeenCalledTimes(1);
      expect(getKeySetsFn).toHaveBeenCalledWith(TEST_ACCOUNT_UUID);
    });
  });
});
