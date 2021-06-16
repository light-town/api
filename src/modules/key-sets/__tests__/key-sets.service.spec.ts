import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import faker from 'faker';
import { Repository } from 'typeorm';
import {
  ApiConflictException,
  ApiForbiddenException,
  ApiNotFoundException,
} from '~/common/exceptions';
import KeySetEntity from '~/db/entities/key-set.entity';
import AccountsService from '~/modules/accounts/accounts.service';
import KeySetsService from '../key-sets.service';
import createModuleHelper from './helpers/create-module.helper';

describe('[Key Set Module] [Service] ...', () => {
  let moduleFixture: TestingModule;
  let keySetsService: KeySetsService;
  let keySetsRepository: Repository<KeySetEntity>;
  let accountsService: AccountsService;

  beforeAll(async () => {
    moduleFixture = await createModuleHelper();

    keySetsService = moduleFixture.get<KeySetsService>(KeySetsService);
    keySetsRepository = moduleFixture.get<Repository<KeySetEntity>>(
      getRepositoryToken(KeySetEntity)
    );
    accountsService = moduleFixture.get<AccountsService>(AccountsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Creating key set', () => {
    it('should create a primary key set', async () => {
      const TEST_CREATOR_ACCOUNT = {
        id: faker.datatype.uuid(),
      };
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

      jest
        .spyOn(accountsService, 'getAccount')
        .mockResolvedValueOnce(<any>TEST_CREATOR_ACCOUNT);

      jest
        .spyOn(keySetsRepository, 'create')
        .mockImplementationOnce((k): any => ({ ...k }));

      jest.spyOn(accountsService, 'exists').mockResolvedValueOnce(true);
      jest.spyOn(keySetsService, 'exists').mockResolvedValueOnce(false);

      jest
        .spyOn(keySetsRepository, 'save')
        .mockImplementationOnce((k): any => ({ ...k }));

      expect(
        await keySetsService.create(
          TEST_CREATOR_ACCOUNT.id,
          TEST_CREATOR_ACCOUNT.id,
          <any>TEST_KEY_SET,
          { isAccountOwner: true, isPrimary: true }
        )
      ).toStrictEqual({
        publicKey: TEST_KEY_SET.publicKey,
        encPrivateKey: TEST_KEY_SET.encPrivateKey,
        encSymmetricKey: TEST_KEY_SET.encSymmetricKey,
        ownerAccountId: TEST_CREATOR_ACCOUNT.id,
        creatorAccountId: TEST_CREATOR_ACCOUNT.id,
        isPrimary: true,
      });

      expect(accountsService.getAccount).toHaveBeenCalledTimes(1);
      expect(accountsService.getAccount).toHaveBeenCalledWith({
        id: TEST_CREATOR_ACCOUNT.id,
      });

      expect(keySetsRepository.create).toHaveBeenCalledTimes(1);
      expect(keySetsRepository.create).toHaveBeenCalledWith({
        creatorAccountId: TEST_CREATOR_ACCOUNT.id,
        publicKey: TEST_KEY_SET.publicKey,
        encPrivateKey: TEST_KEY_SET.encPrivateKey,
        encSymmetricKey: TEST_KEY_SET.encSymmetricKey,
        isPrimary: true,
      });

      expect(accountsService.exists).toHaveBeenCalledTimes(1);
      expect(accountsService.exists).toHaveBeenCalledWith({
        id: TEST_CREATOR_ACCOUNT.id,
      });

      expect(keySetsService.exists).toHaveBeenCalledTimes(1);
      expect(keySetsService.exists).toHaveBeenCalledWith({
        ownerAccountId: TEST_CREATOR_ACCOUNT.id,
        isPrimary: true,
      });

      expect(keySetsRepository.save).toHaveBeenCalledTimes(1);
      expect(keySetsRepository.save).toHaveBeenCalledWith({
        publicKey: TEST_KEY_SET.publicKey,
        encPrivateKey: TEST_KEY_SET.encPrivateKey,
        encSymmetricKey: TEST_KEY_SET.encSymmetricKey,
        ownerAccountId: TEST_CREATOR_ACCOUNT.id,
        creatorAccountId: TEST_CREATOR_ACCOUNT.id,
        isPrimary: true,
      });
    });

    it('should throw an error when creator account was not found', async () => {
      const TEST_CREATOR_ACCOUNT = {
        id: faker.datatype.uuid(),
      };
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

      jest
        .spyOn(accountsService, 'getAccount')
        .mockResolvedValueOnce(undefined);

      jest.spyOn(keySetsRepository, 'create');
      jest.spyOn(accountsService, 'exists');
      jest.spyOn(keySetsService, 'exists');
      jest.spyOn(keySetsRepository, 'save');

      try {
        await keySetsService.create(
          TEST_CREATOR_ACCOUNT.id,
          TEST_CREATOR_ACCOUNT.id,
          <any>TEST_KEY_SET,
          { isAccountOwner: true, isPrimary: true }
        );
      } catch (e) {
        expect(e).toStrictEqual(
          new ApiNotFoundException('The creator account was not found')
        );
      }

      expect(accountsService.getAccount).toHaveBeenCalledTimes(1);
      expect(accountsService.getAccount).toHaveBeenCalledWith({
        id: TEST_CREATOR_ACCOUNT.id,
      });

      expect(accountsService.exists).toHaveBeenCalledTimes(0);
      expect(keySetsService.exists).toHaveBeenCalledTimes(0);
      expect(keySetsRepository.create).toHaveBeenCalledTimes(0);
      expect(keySetsRepository.save).toHaveBeenCalledTimes(0);
    });
  });

  it('should throw an error when not define owner type', async () => {
    const TEST_CREATOR_ACCOUNT = {
      id: faker.datatype.uuid(),
    };
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

    jest
      .spyOn(accountsService, 'getAccount')
      .mockResolvedValueOnce(<any>TEST_CREATOR_ACCOUNT);

    jest
      .spyOn(keySetsRepository, 'create')
      .mockImplementationOnce((k): any => ({ ...k }));

    jest.spyOn(accountsService, 'exists');
    jest.spyOn(keySetsService, 'exists');

    jest.spyOn(keySetsRepository, 'save');

    try {
      await keySetsService.create(
        TEST_CREATOR_ACCOUNT.id,
        TEST_CREATOR_ACCOUNT.id,
        <any>TEST_KEY_SET,
        { isPrimary: true }
      );
    } catch (e) {
      expect(e).toStrictEqual(
        new ApiConflictException(`Not defined owner type: 'Account' or 'Team'`)
      );
    }

    expect(accountsService.getAccount).toHaveBeenCalledTimes(1);
    expect(accountsService.getAccount).toHaveBeenCalledWith({
      id: TEST_CREATOR_ACCOUNT.id,
    });

    expect(keySetsRepository.create).toHaveBeenCalledTimes(1);
    expect(keySetsRepository.create).toHaveBeenCalledWith({
      creatorAccountId: TEST_CREATOR_ACCOUNT.id,
      publicKey: TEST_KEY_SET.publicKey,
      encPrivateKey: TEST_KEY_SET.encPrivateKey,
      encSymmetricKey: TEST_KEY_SET.encSymmetricKey,
      isPrimary: true,
    });

    expect(accountsService.exists).toHaveBeenCalledTimes(0);
    expect(keySetsService.exists).toHaveBeenCalledTimes(0);
    expect(keySetsRepository.save).toHaveBeenCalledTimes(0);
  });

  describe('[isAccountOwner]', () => {
    it('should throw an error when one account want to create primary key set to other account', async () => {
      const TEST_CREATOR_ACCOUNT = {
        id: faker.datatype.uuid(),
      };
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
      const TEST_OWNER_ACCOUNT = {
        id: faker.datatype.uuid(),
      };

      jest
        .spyOn(accountsService, 'getAccount')
        .mockResolvedValueOnce(<any>TEST_CREATOR_ACCOUNT);

      jest
        .spyOn(keySetsRepository, 'create')
        .mockImplementationOnce((k): any => ({ ...k }));

      jest.spyOn(accountsService, 'exists');
      jest.spyOn(keySetsService, 'exists');

      jest.spyOn(keySetsRepository, 'save');

      try {
        await keySetsService.create(
          TEST_CREATOR_ACCOUNT.id,
          TEST_OWNER_ACCOUNT.id,
          <any>TEST_KEY_SET,
          { isAccountOwner: true, isPrimary: true }
        );
      } catch (e) {
        expect(e).toStrictEqual(
          new ApiForbiddenException(
            'The only account owner can create a primary key set'
          )
        );
      }

      expect(accountsService.getAccount).toHaveBeenCalledTimes(1);
      expect(accountsService.getAccount).toHaveBeenCalledWith({
        id: TEST_CREATOR_ACCOUNT.id,
      });

      expect(keySetsRepository.create).toHaveBeenCalledTimes(1);
      expect(keySetsRepository.create).toHaveBeenCalledWith({
        creatorAccountId: TEST_CREATOR_ACCOUNT.id,
        publicKey: TEST_KEY_SET.publicKey,
        encPrivateKey: TEST_KEY_SET.encPrivateKey,
        encSymmetricKey: TEST_KEY_SET.encSymmetricKey,
        isPrimary: true,
      });

      expect(accountsService.exists).toHaveBeenCalledTimes(0);
      expect(keySetsService.exists).toHaveBeenCalledTimes(0);
      expect(keySetsRepository.save).toHaveBeenCalledTimes(0);
    });

    it('should throw an error when owner account was not found', async () => {
      const TEST_CREATOR_ACCOUNT = {
        id: faker.datatype.uuid(),
      };
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
      const TEST_OWNER_ACCOUNT = {
        id: faker.datatype.uuid(),
      };
      const TEST_IS_PRIMARY = false;

      jest
        .spyOn(accountsService, 'getAccount')
        .mockResolvedValueOnce(<any>TEST_CREATOR_ACCOUNT);

      jest
        .spyOn(keySetsRepository, 'create')
        .mockImplementationOnce((k): any => ({ ...k }));

      jest.spyOn(accountsService, 'exists').mockResolvedValueOnce(false);
      jest.spyOn(keySetsService, 'exists');

      jest.spyOn(keySetsRepository, 'save');

      try {
        await keySetsService.create(
          TEST_CREATOR_ACCOUNT.id,
          TEST_OWNER_ACCOUNT.id,
          <any>TEST_KEY_SET,
          { isAccountOwner: true, isPrimary: TEST_IS_PRIMARY }
        );
      } catch (e) {
        expect(e).toStrictEqual(
          new ApiNotFoundException('The account was not found')
        );
      }

      expect(accountsService.getAccount).toHaveBeenCalledTimes(1);
      expect(accountsService.getAccount).toHaveBeenCalledWith({
        id: TEST_CREATOR_ACCOUNT.id,
      });

      expect(keySetsRepository.create).toHaveBeenCalledTimes(1);
      expect(keySetsRepository.create).toHaveBeenCalledWith({
        creatorAccountId: TEST_CREATOR_ACCOUNT.id,
        publicKey: TEST_KEY_SET.publicKey,
        encPrivateKey: TEST_KEY_SET.encPrivateKey,
        encSymmetricKey: TEST_KEY_SET.encSymmetricKey,
        isPrimary: TEST_IS_PRIMARY,
      });

      expect(accountsService.exists).toHaveBeenCalledTimes(1);
      expect(accountsService.exists).toHaveBeenCalledWith({
        id: TEST_OWNER_ACCOUNT.id,
      });

      expect(keySetsService.exists).toHaveBeenCalledTimes(0);
      expect(keySetsRepository.save).toHaveBeenCalledTimes(0);
    });

    it('should throw an error when owner account already has a primary key set', async () => {
      const TEST_CREATOR_ACCOUNT = {
        id: faker.datatype.uuid(),
      };
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
      const TEST_IS_PRIMARY = true;

      jest
        .spyOn(accountsService, 'getAccount')
        .mockResolvedValueOnce(<any>TEST_CREATOR_ACCOUNT);

      jest
        .spyOn(keySetsRepository, 'create')
        .mockImplementationOnce((k): any => ({ ...k }));

      jest.spyOn(accountsService, 'exists').mockResolvedValueOnce(true);
      jest.spyOn(keySetsService, 'exists').mockResolvedValueOnce(true);

      jest.spyOn(keySetsRepository, 'save');

      try {
        await keySetsService.create(
          TEST_CREATOR_ACCOUNT.id,
          TEST_CREATOR_ACCOUNT.id,
          <any>TEST_KEY_SET,
          { isAccountOwner: true, isPrimary: TEST_IS_PRIMARY }
        );
      } catch (e) {
        expect(e).toStrictEqual(
          new ApiConflictException(
            'The account owner already has a primary key set'
          )
        );
      }

      expect(accountsService.getAccount).toHaveBeenCalledTimes(1);
      expect(accountsService.getAccount).toHaveBeenCalledWith({
        id: TEST_CREATOR_ACCOUNT.id,
      });

      expect(keySetsRepository.create).toHaveBeenCalledTimes(1);
      expect(keySetsRepository.create).toHaveBeenCalledWith({
        creatorAccountId: TEST_CREATOR_ACCOUNT.id,
        publicKey: TEST_KEY_SET.publicKey,
        encPrivateKey: TEST_KEY_SET.encPrivateKey,
        encSymmetricKey: TEST_KEY_SET.encSymmetricKey,
        isPrimary: TEST_IS_PRIMARY,
      });

      expect(accountsService.exists).toHaveBeenCalledTimes(1);
      expect(accountsService.exists).toHaveBeenCalledWith({
        id: TEST_CREATOR_ACCOUNT.id,
      });

      expect(keySetsService.exists).toHaveBeenCalledTimes(1);
      expect(keySetsService.exists).toHaveBeenCalledWith({
        ownerAccountId: TEST_CREATOR_ACCOUNT.id,
        isPrimary: true,
      });

      expect(keySetsRepository.save).toHaveBeenCalledTimes(0);
    });
  });
});
