import { ApiProperty } from '@nestjs/swagger';

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
    description: 'The unique id of device where user is signing up',
    required: true,
  })
  deviceId: string;

  @ApiProperty({
    description: 'The operation system of device',
    required: true,
  })
  op: string;

  @ApiProperty({
    description: 'The user agent',
    required: false,
  })
  userAgent?: string;

  @ApiProperty({
    description: 'The hostname',
    required: false,
  })
  hostname?: string;
}

export class SignInPayload {
  @ApiProperty({
    description: 'The account key',
    required: true,
  })
  accountKey: string;

  @ApiProperty({
    description: 'The unique id of device where user is signing in',
    required: true,
  })
  deviceId: string;
}

export class StartSessionPayload {
  @ApiProperty({
    description: 'The unique id of session',
    required: true,
  })
  sessionId: string;

  @ApiProperty({
    description: 'The client public ephemeral key',
    required: true,
  })
  clientPubicEphemeralKey: string;

  @ApiProperty({
    description: 'The client session proof key',
    required: true,
  })
  clientSessionProofKey: string;
}

export class SignInResponse {
  @ApiProperty({
    description: 'The unique session id',
  })
  sessionId: string;

  @ApiProperty({
    description: 'The verifier of SRP key',
  })
  salt: string;

  @ApiProperty({
    description: 'The server public ephemeral key',
  })
  serverPublicEphemeral: string;
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
