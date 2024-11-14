import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum HealthStatus {
  HEALTHLY = 'healthly',
  UNHEALTHLY = 'unhealthy',
}

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}

export class ComponentStatusDto {
  @IsNotEmpty()
  @ApiProperty()
  @IsEnum(HealthStatus)
  status: HealthStatus;

  @IsNotEmpty()
  @ApiProperty()
  @IsEnum(ConnectionStatus)
  connectionStatus: ConnectionStatus;

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  @IsOptional()
  error?: string;
}
