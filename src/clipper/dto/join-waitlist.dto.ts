import { IsArray, IsString, IsUrl, ArrayMinSize } from 'class-validator';

export class JoinWaitlistDto {
  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMinSize(1)
  clipUrls: string[];

  @IsString()
  twitchUsername: string;

  @IsString()
  tiktokUsername: string;

  @IsString()
  motivation: string;
}
