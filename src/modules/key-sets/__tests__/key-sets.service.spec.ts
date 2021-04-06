import { TestingModule } from '@nestjs/testing';
import * as faker from 'faker';
import { ApiNotFoundException } from '~/common/exceptions';
import KeySetsService from '../key-sets.service';
import createModuleHelper from './helpers/create-module.helper';

describe('[Key Set Module] [Service] ...', () => {
  let moduleFixture: TestingModule;
  let keySetsService: KeySetsService;

  beforeAll(async () => {
    moduleFixture = await createModuleHelper();

    keySetsService = moduleFixture.get<KeySetsService>(KeySetsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Getting primary key set', () => {
    it('should return primary key set', async () => {
      const TEST_ACCOUNT_UUID = faker.datatype.uuid();
      const TEST_KEY_SET = {
        id: faker.datatype.uuid(),
        publicKey: faker.datatype.uuid(),
        encPrivateKey: {
          key: faker.datatype.uuid(),
        },
        encSymmetricKey: {
          key: faker.datatype.uuid(),
        },
      };

      const findOneKeySetFn = jest
        .spyOn(keySetsService, 'findOne')
        .mockResolvedValueOnce(<any>TEST_KEY_SET);

      expect(
        await keySetsService.getKeySet({
          accountId: TEST_ACCOUNT_UUID,
          primary: true,
        })
      ).toStrictEqual(TEST_KEY_SET);

      expect(findOneKeySetFn).toHaveBeenCalledTimes(1);
      expect(findOneKeySetFn).toHaveBeenCalledWith({
        select: ['id', 'publicKey', 'encPrivateKey', 'encSymmetricKey'],
        where: {
          accountId: TEST_ACCOUNT_UUID,
          isPrimary: true,
          isDeleted: false,
        },
      });
    });

    it('should throw an error when primary key set was not found', async () => {
      const TEST_ACCOUNT_UUID = faker.datatype.uuid();

      const findOneKeySetFn = jest
        .spyOn(keySetsService, 'findOne')
        .mockResolvedValueOnce(undefined);

      try {
        await keySetsService.getKeySet({
          accountId: TEST_ACCOUNT_UUID,
          primary: true,
        });
      } catch (e) {
        expect(e).toStrictEqual(
          new ApiNotFoundException('The primary key set was not found')
        );
      }

      expect(findOneKeySetFn).toHaveBeenCalledTimes(1);
      expect(findOneKeySetFn).toHaveBeenCalledWith({
        select: ['id', 'publicKey', 'encPrivateKey', 'encSymmetricKey'],
        where: {
          accountId: TEST_ACCOUNT_UUID,
          isPrimary: true,
          isDeleted: false,
        },
      });
    });
  });

  describe('Getting all key sets', () => {
    it('should return all key sets', async () => {
      const TEST_ACCOUNT_UUID = faker.datatype.uuid();
      const TEST_KEY_SETS = [
        {
          id: faker.datatype.uuid(),
          publicKey: faker.datatype.uuid(),
          encPrivateKey: {
            key: faker.datatype.uuid(),
          },
          encSymmetricKey: {
            key: faker.datatype.uuid(),
          },
        },
      ];

      const findKeySetFn = jest
        .spyOn(keySetsService, 'find')
        .mockResolvedValueOnce(<any>TEST_KEY_SETS);

      expect(
        await keySetsService.getKeySets({ accountId: TEST_ACCOUNT_UUID })
      ).toStrictEqual(TEST_KEY_SETS);

      expect(findKeySetFn).toHaveBeenCalledTimes(1);
      expect(findKeySetFn).toHaveBeenCalledWith({
        select: ['id', 'publicKey', 'encPrivateKey', 'encSymmetricKey'],
        where: {
          accountId: TEST_ACCOUNT_UUID,
          isDeleted: false,
        },
      });
    });
  });
});
