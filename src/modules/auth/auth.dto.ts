import { ApiProperty } from '@nestjs/swagger';
import { VerifySessionStageEnum } from '../sessions/sessions.dto';

export class SignUpPayload {
  @ApiProperty({
    description: 'The unique account key',
    required: true,
  })
  accountKey: string;

  @ApiProperty({
    description: 'The salt of SRP key',
    required: true,
  })
  salt: string;

  @ApiProperty({
    description: 'The verifier of SRP key',
    required: true,
  })
  verifier: string;

  @ApiProperty({
    description: 'The name of new user',
    required: true,
  })
  username: string;

  @ApiProperty({
    description: 'The avatar url',
    required: false,
  })
  avatarUrl?: string;

  @ApiProperty({
    description: 'The unique uuid of device',
  })
  deviceUuid: string;
}

export class SignInPayload {
  @ApiProperty({
    description: 'The account key',
    required: true,
  })
  accountKey: string;

  @ApiProperty({
    description: 'The unique uuid of device',
  })
  deviceUuid: string;
}

export class StartSessionPayload {
  @ApiProperty({
    description: 'The unique id of session',
    required: true,
  })
  sessionUuid: string;

  @ApiProperty({
    description: 'The client public ephemeral key',
    required: true,
  })
  clientPublicEphemeralKey: string;

  @ApiProperty({
    description: 'The client session proof key',
    required: true,
  })
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
    description: 'The multi-factor authorization type',
    enum: () => MFATypesEnum,
  })
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
}

export class VerifySessionResponse {
  @ApiProperty({
    description: 'The current stage of session verifying',
    enum: () => VerifySessionStageEnum,
  })
  stage: VerifySessionStageEnum;
}
