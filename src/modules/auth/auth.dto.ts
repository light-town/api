import { ApiProperty } from '@nestjs/swagger';
import { SessionVerificationStageEnum } from '../sessions/sessions.dto';
import { IsString, IsNotEmpty, IsOptional } from '~/common/validation';
import { Device } from '../devices/devices.dto';
import { IsEnum, ValidateNested } from 'class-validator';
import { CreateKeySetPayload } from '~/modules/key-sets/key-sets.dto';
import { CreateVaultPayload } from '~/modules/vaults/vaults.dto';
import { CreateVaultItemPayload } from '../vault-items/vault-items.dto';
import { CreateVaultItemCategoryOptions } from '../vault-item-categories/vault-item-categories.dto';

export class SRP {
  @ApiProperty({
    description: 'The verifier of SRP key',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  verifier: string;

  @ApiProperty({
    description: 'The salt of SRP key',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  salt: string;
}

export class Account {
  @ApiProperty({
    description: 'The unique account key',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'The name of new user',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'The avatar url',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  avatarUrl?: string;
}

export class SignUpPayload {
  @ApiProperty({
    description: 'The unique uuid of device',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  deviceUuid: string;

  @ApiProperty({
    description: 'The SRP auth configuration',
    required: true,
  })
  @ValidateNested()
  srp: SRP;

  @ApiProperty({
    description: 'The account configuration',
    required: true,
  })
  @ValidateNested()
  account: Account;

  @ApiProperty({
    description: 'The primary key set configuration',
    required: true,
  })
  @ValidateNested()
  primaryKeySet: CreateKeySetPayload;

  @ApiProperty({
    description: 'The primary vault configuration',
    required: true,
  })
  @ValidateNested()
  primaryVault: CreateVaultPayload;

  @ApiProperty({
    description: 'The primary vault items',
    required: false,
    default: [],
  })
  primaryVaultItems: {
    encOverview: Record<string, any>;
    encDetails?: Record<string, any>;
    category: CreateVaultItemCategoryOptions;
  }[];
}

export class SessionCreatePayload {
  @ApiProperty({
    description: 'The account key',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  accountKey: string;

  @ApiProperty({
    description: 'The unique uuid of device',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  deviceUuid: string;
}

export class SessionStartPayload {
  @ApiProperty({
    description: 'The client public ephemeral key',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  clientPublicEphemeralKey: string;

  @ApiProperty({
    description: 'The client session proof key',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  clientSessionProofKey: string;
}

export enum MFATypesEnum {
  NONE = 'NONE',
  FINGERPRINT = 'FINGERPRINT',
  ONE_TIME_PASSWORD = 'ONE_TIME_PASSWORD',
}

export class SessionVerificationType {
  @ApiProperty({
    description: 'The stage of verifying session',
    enum: SessionVerificationStageEnum,
    required: true,
  })
  @ValidateNested()
  stage: SessionVerificationStageEnum;

  @ApiProperty({
    description: 'The MFA type of account authorization',
    enum: MFATypesEnum,
    required: true,
  })
  @IsEnum(MFATypesEnum)
  MFAType: MFATypesEnum;

  @ApiProperty({
    description: 'The device that verifying session',
    required: false,
  })
  @ValidateNested()
  verificationDevice?: Device;
}

export class SessionCreateResponse {
  @ApiProperty({
    description: 'The unique session id',
    required: true,
  })
  sessionUuid: string;

  @ApiProperty({
    description: 'The verifier of SRP key',
    required: true,
  })
  salt: string;

  @ApiProperty({
    description: 'The server public ephemeral key',
    required: true,
  })
  serverPublicEphemeral: string;

  @ApiProperty({
    description: 'The process info of verifying session',
    required: true,
  })
  sessionVerification: SessionVerificationType;
}

export class SessionStartResponse {
  @ApiProperty({
    description: 'The JWT token that expires in 10 minutes',
    required: true,
  })
  token: string;

  @ApiProperty({
    description: 'The server session proof',
    required: true,
  })
  serverSessionProof: string;
}

export class SessionVerifyPayload {
  @ApiProperty({
    description: 'The unique device uuid that verify session',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  deviceUuid: string;
}

export class SessionVerifyResponse {
  @ApiProperty({
    description: 'The current stage of session verifying',
    enum: SessionVerificationStageEnum,
    required: true,
  })
  stage: SessionVerificationStageEnum;
}

export class GetCsrfTokenResponse {
  @ApiProperty({
    description: 'Return a csrf token. Mobile devices need it',
    required: true,
  })
  'X-CSRF-TOKEN': string;
}

export class RefreshTokenResponse {
  @ApiProperty({
    description: 'The refreshed token',
    required: true,
  })
  token: string;
}
