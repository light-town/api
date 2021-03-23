import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from '~/common/validation';

export class DeviceCreatePayload {
  @ApiProperty({
    description: 'The operation system of device',
    required: true,
  })
  @IsString()
  op: string;

  @ApiProperty({
    description: 'The user agent',
    required: false,
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({
    description: 'The hostname',
    required: true,
  })
  @IsString()
  hostname: string;
}

export class DeviceCreateResponse {
  @ApiProperty({
    description: 'The unique uuid of device',
  })
  deviceUuid: string;
}
