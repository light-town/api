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
