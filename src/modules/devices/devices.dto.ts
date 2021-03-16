import { ApiProperty } from '@nestjs/swagger';

export class DeviceCreatePayload {
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
    required: true,
  })
  hostname: string;
}

export class DeviceCreateResponse {
  @ApiProperty({
    description: 'The unique uuid of device',
  })
  deviceUuid: string;
}
