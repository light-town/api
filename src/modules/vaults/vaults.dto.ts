import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from '~/common/validation';
import { ValidateNested } from 'class-validator';

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

export class PrimaryVault {
  @ApiProperty({
    description: 'The encrypted vault key',
    required: true,
  })
  @ValidateNested()
  encVaultKey: EncVaultKey;
}
