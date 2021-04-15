import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsObject, IsString, IsUUID } from 'class-validator';

export class CreateVaultItemPayload {
  @ApiProperty({
    description: 'The encryped vault item overview',
    required: true,
  })
  @IsObject()
  encOverview: Record<string, any>;

  @ApiProperty({
    description: 'The encryped vault item details',
    required: true,
  })
  @IsObject()
  encDetails: Record<string, any>;

  @ApiProperty({
    description: 'The vault item category uuid',
    required: true,
  })
  @IsString()
  @IsUUID()
  categoryUuid: string;
}

export class VaultItem {
  @ApiProperty({
    description: 'The unique vault item uuid',
    required: true,
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'The encryped vault item overview',
    required: true,
  })
  @IsObject()
  encOverview: Record<string, any>;

  @ApiProperty({
    description: 'The encryped vault item details',
  })
  @IsObject()
  encDetails?: Record<string, any>;

  @ApiProperty({
    description: 'The unique uuid of vault',
    required: true,
  })
  @IsString()
  @IsUUID()
  vaultUuid: string;

  @ApiProperty({
    description: 'The unique uuid of vault folder',
    required: true,
  })
  @IsString()
  @IsUUID()
  folderUuid: string;

  @ApiProperty({
    description: 'The unique uuid of vault item category',
    required: true,
  })
  @IsString()
  @IsUUID()
  categoryUuid: string;

  @ApiProperty({
    description: 'The unique uuid of creator account',
    required: true,
  })
  @IsString()
  @IsUUID()
  creatorAccountUuid: string;

  @ApiProperty({
    description: 'The datetime of last updating vault item',
    required: true,
  })
  @IsDate()
  lastUpdatedAt: string;

  @ApiProperty({
    description: 'The datetime of creating vault item',
    required: true,
  })
  @IsDate()
  createdAt: string;
}
