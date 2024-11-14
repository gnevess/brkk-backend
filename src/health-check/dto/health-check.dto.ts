import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsString } from 'class-validator';

import { ComponentStatusDto, HealthStatus } from './component-status.dto';

export class ApplicationStatusDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  version: string;

  @IsString()
  @ApiProperty()
  uptime: string;

  @IsNotEmpty()
  @ApiProperty()
  @IsEnum(HealthStatus)
  status: HealthStatus;

  @ApiProperty()
  database: ComponentStatusDto;
}
