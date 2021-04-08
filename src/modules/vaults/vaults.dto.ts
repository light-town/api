import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from '~/common/validation';
import { ValidateNested } from 'class-validator';
import { CreateKeySetPayload as CreateKeySet } from '~/modules/key-sets/key-sets.dto';

export class EncVaultKey {
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

export class Vault {
  @ApiProperty({
    description: 'The unique uuid of vault',
    required: true,
  })
  @ValidateNested()
  uuid: string;

  @ApiProperty({
    description: 'The encrypted vault key',
    required: true,
  })
  @ValidateNested()
  encKey: EncVaultKey;

  @ApiProperty({
    description: 'The encrypted metadata of vault',
    required: true,
  })
  @ValidateNested()
  encMetadata: any;
}

export class CreateVault {
  @ApiProperty({
    description: 'The encrypted vault key',
    required: true,
  })
  @ValidateNested()
  encKey: EncVaultKey;

  @ApiProperty({
    description: 'The encrypted metadata of vault',
    required: true,
  })
  @ValidateNested()
  encMetadata: any;
}

export class CreateVaultPayload {
  @ApiProperty({
    description: 'The key set creation configuration',
    required: true,
  })
  @ValidateNested()
  keySet: CreateKeySet;

  @ApiProperty({
    description: 'The vault creation configuration',
    required: true,
  })
  @ValidateNested()
  vault: CreateVault;
}
