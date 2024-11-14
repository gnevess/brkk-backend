import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ComponentStatusDto, ConnectionStatus, HealthStatus } from './dto/component-status.dto';
import { ApplicationStatusDto } from './dto/health-check.dto';
@Injectable()
export class HealthCheckService {
  private readonly applicationName = process.env.npm_package_name;
  private readonly applicationVersion = process.env.npm_package_version;

  constructor(private readonly prisma: PrismaService) {}

  private async getSqlDatabaseStatus(): Promise<ComponentStatusDto> {
    try {
      const connectionStatus = (await this.prisma.$queryRaw`SELECT 1`)
        ? ConnectionStatus.CONNECTED
        : ConnectionStatus.DISCONNECTED;

      return {
        status: connectionStatus === ConnectionStatus.CONNECTED ? HealthStatus.HEALTHLY : HealthStatus.UNHEALTHLY,
        connectionStatus,
      };
    } catch (_) {
      return {
        status: HealthStatus.UNHEALTHLY,
        connectionStatus: ConnectionStatus.DISCONNECTED,
      };
    }
  }

  private getApplicationStatus(componentStatusList: ComponentStatusDto[]): HealthStatus {
    return componentStatusList.every(({ status }) => status === HealthStatus.HEALTHLY)
      ? HealthStatus.HEALTHLY
      : HealthStatus.UNHEALTHLY;
  }

  public async getApplicationStats(): Promise<ApplicationStatusDto> {
    const sqlDatabaseStatus = await this.getSqlDatabaseStatus();
    const status = this.getApplicationStatus([sqlDatabaseStatus]);
    const processUptime: number = process.uptime();

    if (status === HealthStatus.UNHEALTHLY) {
      throw new InternalServerErrorException({
        name: this.applicationName,
        status,
        version: this.applicationVersion,
        uptime: `${processUptime.toString()} seconds`,
        database: sqlDatabaseStatus,
      });
    }

    return {
      name: this.applicationName ?? 'Unknown',
      status,
      uptime: `${processUptime.toString()} seconds`,
      version: this.applicationVersion ?? '0.0.1',
      database: sqlDatabaseStatus,
    };
  }
}
