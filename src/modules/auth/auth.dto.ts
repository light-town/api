import { ApiProperty } from '@nestjs/swagger';
import { SessionVerificationStageEnum } from '../sessions/sessions.dto';
import { IsString, IsNotEmpty, IsOptional } from '~/common/validation';
import { Device } from '../devices/devices.dto';

export class SignUpPayload {
  @ApiProperty({
    description: 'The unique account key',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  accountKey: string;

  @ApiProperty({
    description: 'The salt of SRP key',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  salt: string;

  @ApiProperty({
    description: 'The verifier of SRP key',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  verifier: string;

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

  @ApiProperty({
    description: 'The unique uuid of device',
  })
  @IsString()
  @IsNotEmpty()
  deviceUuid: string;
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
  stage: SessionVerificationStageEnum;

  @ApiProperty({
    description: 'The MFA type of account authorization',
    enum: MFATypesEnum,
    required: true,
  })
  MFAType: MFATypesEnum;

  @ApiProperty({
    description: 'The device that verifying session',
    required: false,
  })
  verificationDevice?: Device;
}

export class SessionCreateResponse {
  @ApiProperty({
    description: 'The unique session id',
  })
  sessionUuid: string;

  @ApiProperty({
    description: 'The verifier of SRP key',
  })
  salt: string;

  @ApiProperty({
    description: 'The server public ephemeral key',
  })
  serverPublicEphemeral: string;

  @ApiProperty({
    description: 'The process info of verifying session',
  })
  sessionVerification: SessionVerificationType;
}

export class SessionStartResponse {
  @ApiProperty({
    description: 'The JWT token that expires in 10 minutes',
  })
  token: string;

  @ApiProperty({
    description: 'The server session proof',
  })
  serverSessionProof: string;
}

export class SessionVerifyPayload {
  @ApiProperty({
    description: 'The unique device uuid that verify session',
  })
  @IsString()
  @IsNotEmpty()
  deviceUuid: string;
}

export class SessionVerifyResponse {
  @ApiProperty({
    description: 'The current stage of session verifying',
    enum: SessionVerificationStageEnum,
  })
  stage: SessionVerificationStageEnum;
}

export class GetCsrfTokenResponse {
  @ApiProperty({
    description: 'Return a csrf token. Mobile devices need it',
  })
  'X-CSRF-TOKEN': string;
}
