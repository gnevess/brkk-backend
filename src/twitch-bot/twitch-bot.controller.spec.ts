import { Test, TestingModule } from '@nestjs/testing';
import { TwitchBotController } from './twitch-bot.controller';

describe('TwitchBotController', () => {
  let controller: TwitchBotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwitchBotController],
    }).compile();

    controller = module.get<TwitchBotController>(TwitchBotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
