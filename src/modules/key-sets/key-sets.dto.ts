import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from '~/common/validation';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';

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
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tag?: string;

  @ApiProperty({
    description: '',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  tagLength?: number;

  @ApiProperty({
    description: 'The initial vector',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  iv?: string;

  @ApiProperty({
    description: 'The salt for deriving MUK',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  salt?: string;
}

export class CreateKeySetPayload {
  @ApiProperty({
    description: 'The RSA public key',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  publicKey?: string;

  @ApiProperty({
    description: 'The encrypted RSA private key',
  })
  @IsOptional()
  @ValidateNested()
  encPrivateKey?: EncPrivateKey;

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

  @ApiProperty({
    description: 'The unique uuid of the creator account',
    required: true,
  })
  @IsString()
  @IsUUID()
  creatorAccountUuid: string;

  @ApiProperty({
    description: 'The unique uuid of the owner account',
    required: false,
  })
  @IsString()
  @IsUUID()
  ownerAccountUuid?: string;

  @ApiProperty({
    description: 'The unique uuid of the owner team',
    required: false,
  })
  @IsString()
  @IsUUID()
  ownerTeamUuid?: string;

  @ApiProperty({
    description: 'The primary flag',
    required: true,
  })
  @IsBoolean()
  isPrimary: boolean;
}
