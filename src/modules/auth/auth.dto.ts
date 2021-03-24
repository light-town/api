import { ApiProperty } from '@nestjs/swagger';
import { VerifySessionStageEnum } from '../sessions/sessions.dto';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from '~/common/validation';
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

export class SignInPayload {
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

export class StartSessionPayload {
  @ApiProperty({
    description: 'The unique id of session',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  sessionUuid: string;

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

export class SignInResponse {
  @ApiProperty({
    description: 'The unique session id',
  })
  @IsString()
  @IsNotEmpty()
  sessionUuid: string;

  @ApiProperty({
    description: 'The verifier of SRP key',
  })
  @IsString()
  @IsNotEmpty()
  salt: string;

  @ApiProperty({
    description: 'The server public ephemeral key',
  })
  @IsString()
  @IsNotEmpty()
  serverPublicEphemeral: string;

  @ApiProperty({
    description: 'The multi-factor authorization type',
    enum: () => MFATypesEnum,
  })
  @IsEnum(MFATypesEnum, { message: '' })
  mfaType: MFATypesEnum;
}

export class StartSessionResponse {
  @ApiProperty({
    description: 'The JWT token. Expires in 10 minutes',
  })
  token: string;

  @ApiProperty({
    description: 'The server session proof',
  })
  serverSessionProof: string;
}

export class VerifySessionPayload {
  @ApiProperty({
    description: 'The unique session uuid',
  })
  sessionUuid: string;

  @ApiProperty({
    description: 'The unique device uuid that verify session',
  })
  deviceUuid: string;
}

export class VerifySessionResponse {
  @ApiProperty({
    description: 'The current stage of session verifying',
    enum: () => VerifySessionStageEnum,
  })
  stage: VerifySessionStageEnum;
}

export class GetCsrfTokenResponse {
  @ApiProperty({
    description: 'Return a csrf token. Mobile devices need it',
  })
  'X-CSRF-TOKEN': string;
}
