import { getConnectionToken, getRepositoryToken } from '@nestjs/typeorm';
import mockRepository from './mock-repository';
import UserEntity from '~/db/entities/user.entity';
import AccountEntity from '~/db/entities/account.entity';
import DeviceEntity from '~/db/entities/device.entity';
import SessionEntity from '~/db/entities/session.entity';
import MFATypeEntity from '~/db/entities/mfa-type.entity';
import SessionVerificationStageEntity from '~/db/entities/session-verification-stage.entity';
import PushNotificationStageEntity from '~/db/entities/push-notification-stage.entity';
import PushNotificationEntity from '~/db/entities/push-notification.entity';
import VerificationDeviceEntity from '~/db/entities/verification-devices.entity';
import KeySetEntity from '~/db/entities/key-sets.entity';
import VaultEntity from '~/db/entities/vault.entity';
import { TestingModuleBuilder } from '@nestjs/testing';
import { KeySetVaultEntity } from '~/db/entities/key-set-vaults.entity';
import VaultItemEntity from '~/db/entities/vault-item.entity';
import VaultFolderEntity from '~/db/entities/vault-folder.entity';

export default (app: TestingModuleBuilder) => {
  const entities = [
    UserEntity,
    AccountEntity,
    DeviceEntity,
    VerificationDeviceEntity,
    SessionEntity,
    MFATypeEntity,
    SessionVerificationStageEntity,
    PushNotificationEntity,
    PushNotificationStageEntity,
    KeySetEntity,
    VaultEntity,
    KeySetVaultEntity,
    VaultItemEntity,
    VaultFolderEntity,
  ];

  entities.forEach(e =>
    app
      .overrideProvider(getRepositoryToken(e))
      .useFactory({ factory: mockRepository })
  );

  return app.overrideProvider(getConnectionToken()).useFactory({
    factory: jest.fn(() => ({
      manager: jest.fn(),
      transaction: jest.fn(),
    })),
  });
};
