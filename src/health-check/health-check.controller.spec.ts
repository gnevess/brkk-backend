import { Test } from '@nestjs/testing';
import { HealthCheckController } from './health-check.controller';
import { HealthCheckService } from './health-check.service';
import { PrismaService } from 'nestjs-prisma';

describe('HealthCheckController', () => {
  let healthCheckController: HealthCheckController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthCheckController],
      providers: [PrismaService, HealthCheckService],
    }).compile();

    healthCheckController = moduleRef.get<HealthCheckController>(HealthCheckController);
  });

  describe('RunningCheck', () => {
    it('should return ok', () => {
      const result = 'OK';
      expect(healthCheckController.getApplicationStatsSimplified()).toBe(result);
    });
  });
});
