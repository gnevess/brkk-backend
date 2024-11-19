import { Test, TestingModule } from '@nestjs/testing';
import { TwitchBotService } from './twitch-bot.service';

describe('TwitchBotService', () => {
  let service: TwitchBotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TwitchBotService],
    }).compile();

    service = module.get<TwitchBotService>(TwitchBotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
