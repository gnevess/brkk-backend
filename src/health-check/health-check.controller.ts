import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from './health-check.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApplicationStatusDto } from './dto/health-check.dto';

@ApiTags('Health Check')
@Controller('health-check')
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get('/')
  @ApiOperation({ summary: 'Check if the application is running' })
  getApplicationStatsSimplified(): string {
    return 'OK';
  }

  @Get('/info')
  @ApiOperation({ summary: 'Check database and application version' })
  @ApiOkResponse({ type: ApplicationStatusDto })
  async getApplicationStats(): Promise<ApplicationStatusDto> {
    return await this.healthCheckService.getApplicationStats();
  }
}
