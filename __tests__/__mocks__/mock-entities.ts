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
import VaultItemCategoryEntity from '~/db/entities/vault-item-category.entity';
import TeamEntity from '~/db/entities/team.entity';
import TeamMemberEntity from '~/db/entities/team-member.entity';
import RoleEntity from '~/db/entities/role.entity';
import PermissionEntity from '~/db/entities/permission.entity';
import PermissionObjectTypeEntity from '~/db/entities/permission-object-type.entity';
import PermissionTypeEntity from '~/db/entities/permission-type.entity';
import InvitationEntity from '~/db/entities/invitation.entity';
import InvitationVerificationStageEntity from '~/db/entities/invitation-verification-stage.entity';

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
    VaultItemCategoryEntity,
    TeamEntity,
    TeamMemberEntity,
    RoleEntity,
    PermissionEntity,
    PermissionTypeEntity,
    PermissionObjectTypeEntity,
    InvitationEntity,
    InvitationVerificationStageEntity,
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
