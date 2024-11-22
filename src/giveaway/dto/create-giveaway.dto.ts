import { IsString, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateGiveawayDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  image: string;

  @IsNumber()
  @Min(0)
  ticketPrice: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @Min(1)
  winnerCount: number;
}
