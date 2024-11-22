import { IsNumber, Min } from 'class-validator';

export class ParticipateGiveawayDto {
  @IsNumber()
  @Min(1)
  tickets: number;
}
