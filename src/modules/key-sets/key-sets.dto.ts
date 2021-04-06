import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from '~/common/validation';
import { IsNumber, IsPositive, IsUUID, ValidateNested } from 'class-validator';

export class EncPrivateKey {
  @ApiProperty({
    description: 'The type of encryption algorithm',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  kty: string;

  @ApiProperty({
    description: 'The encryption algorithm',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  alg: string;

  @ApiProperty({
    description: 'The encrypted key',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  key: string;
}

export class EncSymmetricKey {
  @ApiProperty({
    description: 'The type of encryption algorithm',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  kty: string;

  @ApiProperty({
    description: 'The encryption algorithm',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  alg: string;

  @ApiProperty({
    description: 'The encrypted key',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: '',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  tag: string;

  @ApiProperty({
    description: '',
    required: true,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  tagLength: number;

  @ApiProperty({
    description: 'The initial vector',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  iv: string;

  @ApiProperty({
    description: 'The salt for deriving MUK',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  salt: string;
}

export class CreateKeySetPayload {
  @ApiProperty({
    description: 'The RSA public key',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @ApiProperty({
    description: 'The encrypted RSA private key',
    required: true,
  })
  @ValidateNested()
  encPrivateKey: EncPrivateKey;

  @ApiProperty({
    description: 'The encrypted symmetric key',
    required: true,
  })
  @ValidateNested()
  encSymmetricKey: EncSymmetricKey;
}

export class KeySet extends CreateKeySetPayload {
  @ApiProperty({
    description: 'The unique uuid of key set',
    required: true,
  })
  @IsString()
  @IsUUID()
  uuid: string;
}
