import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import DevicesService from './devices.service';
import {
  Device,
  DeviceCreatePayload,
  DeviceCreateResponse,
} from './devices.dto';
import DeviceEntity from '~/db/entities/device.entity';
import { Request } from 'express';

@ApiTags('/devices')
@Controller('/devices')
export class DevicesController {
  public constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiCreatedResponse({ type: DeviceCreateResponse })
  public async createDevice(
    @Req() req: Request,
    @Body() payload: DeviceCreatePayload
  ): Promise<DeviceCreateResponse> {
    const device = await this.devicesService.create({
      os: payload.os,
      userAgent: req.header('user-agent'),
      hostname: req.ip.split(':').pop(),
    });
    return { deviceUuid: device.id };
  }

  @Get()
  @ApiOkResponse({ type: [Device] })
  public getAllDevices(): Promise<DeviceEntity[]> {
    return this.devicesService.find({
      select: ['id', 'os', 'userAgent', 'hostname'],
      where: {
        isDeleted: false,
      },
    });
  }

  @Get('/:deviceId')
  @ApiOkResponse({ type: Device })
  @ApiNotFoundResponse({ description: 'The device was not found' })
  public async getDevice(
    @Param('deviceId') deviceId: string
  ): Promise<DeviceEntity> {
    const device = await this.devicesService.findOne({
      select: ['id', 'os', 'userAgent', 'hostname'],
      where: {
        id: deviceId,
        isDeleted: false,
      },
    });

    if (!device) throw new NotFoundException(`The device was not found`);

    return device;
  }

  @Delete('/:deviceId')
  @ApiOkResponse()
  @ApiNotFoundResponse({ description: 'The device was not found' })
  public async deleteDevice(
    @Param('deviceId') deviceId: string
  ): Promise<void> {
    const device = await this.devicesService.findOne({
      select: ['id'],
      where: {
        id: deviceId,
        isDeleted: false,
      },
    });

    if (!device) throw new NotFoundException(`The device was not found`);

    await this.devicesService.update(
      {
        id: device.id,
      },
      { isDeleted: true }
    );
  }
}

export default DevicesController;
