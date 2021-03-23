import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import DevicesService from './devices.service';
import { DeviceCreatePayload, DeviceCreateResponse } from './devices.dto';

@ApiTags('/devices')
@Controller('/devices')
export class DevicesController {
  public constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiCreatedResponse({ type: DeviceCreateResponse })
  @ApiNotFoundResponse()
  public async createDevice(
    @Body() payload: DeviceCreatePayload
  ): Promise<DeviceCreateResponse> {
    const device = await this.devicesService.create(payload);
    return { deviceUuid: device.id };
  }
}

export default DevicesController;
