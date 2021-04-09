import { TestingModule } from '@nestjs/testing';
import * as faker from 'faker';
import { ApiForbiddenException } from '~/common/exceptions';
import { MFATypesEnum } from '~/modules/auth/auth.dto';
import AccountsController from '../accounts.controller';
import AccountsService from '../accounts.service';
import createTestingModule from './helpers/create-module.helper';

describe('[Accounts Module] [Controller] ...', () => {
  let app: TestingModule;
  let accountsController: AccountsController;
  let accountsService: AccountsService;

  beforeAll(async () => {
    app = await createTestingModule();

    accountsController = app.get<AccountsController>(AccountsController);
    accountsService = app.get<AccountsService>(AccountsService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should return all accounts', async () => {
    const TEST_USER = {
      id: faker.datatype.uuid(),
      name: faker.random.word(),
      avatarUrl: null,
    };
    const TEST_ACCOUNTS = [
      {
        id: faker.datatype.uuid(),
        userId: TEST_USER.id,
        user: TEST_USER,
        mfaType: {
          name: MFATypesEnum.NONE,
        },
      },
    ];

    jest
      .spyOn(accountsService, 'getAccounts')
      .mockResolvedValueOnce(<any>TEST_ACCOUNTS);

    expect(await accountsController.getAccounts(undefined)).toStrictEqual(
      TEST_ACCOUNTS.map(a => ({
        accountUuid: a.id,
        accountName: a.user.name,
        accountAvatarUrl: a.user.avatarUrl,
        userUuid: a.user.id,
        userName: a.user.name,
        userAvatarUrl: a.user.avatarUrl,
        MFAType: a.mfaType.name,
      }))
    );

    expect(accountsService.getAccounts).toHaveBeenCalledTimes(1);
    expect(accountsService.getAccounts).toHaveBeenCalledWith({});
  });

  it('should set multi-factor auth for account', async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_ACCOUNT = {
      id: faker.datatype.uuid(),
    };
    const TEST_MFA_TYPE = MFATypesEnum.FINGERPRINT;

    jest
      .spyOn(accountsService, 'setMultiFactorAuthType')
      .mockResolvedValueOnce();

    await accountsController.setMultiFactorAuth(TEST_ACCOUNT, TEST_ACCOUNT.id, {
      deviceUuid: TEST_DEVICE.id,
      type: TEST_MFA_TYPE,
    });

    expect(accountsService.setMultiFactorAuthType).toHaveBeenCalledTimes(1);
    expect(accountsService.setMultiFactorAuthType).toHaveBeenCalledWith(
      TEST_ACCOUNT.id,
      TEST_DEVICE.id,
      TEST_MFA_TYPE
    );
  });

  it('should throw an error when some account want to set multi-factor auth for other account', async () => {
    const TEST_DEVICE = {
      id: faker.datatype.uuid(),
    };
    const TEST_ACCOUNT = {
      id: faker.datatype.uuid(),
    };
    const TEST_OWNER_ACCOUNT = {
      id: faker.datatype.uuid(),
    };

    jest.spyOn(accountsService, 'setMultiFactorAuthType');

    try {
      await accountsController.setMultiFactorAuth(
        TEST_ACCOUNT,
        TEST_OWNER_ACCOUNT.id,
        { deviceUuid: TEST_DEVICE.id, type: MFATypesEnum.FINGERPRINT }
      );
    } catch (e) {
      expect(e).toStrictEqual(new ApiForbiddenException('Аccess denied'));
    }

    expect(accountsService.setMultiFactorAuthType).toHaveBeenCalledTimes(0);
  });
});
