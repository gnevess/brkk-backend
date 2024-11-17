import { IsString, IsNumber, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class TwitchUserData {
  @IsString()
  id: string;

  @IsString()
  login: string;

  @IsString()
  display_name: string;

  @IsString()
  type: string;

  @IsString()
  broadcaster_type: string;

  @IsString()
  description: string;

  @IsString()
  profile_image_url: string;

  @IsString()
  offline_image_url: string;

  @IsNumber()
  view_count: number;

  @IsString()
  email: string;

  @IsString()
  created_at: string;
}

export class TwitchAuthDTO {
  @IsString()
  accessToken: string;

  @ValidateNested()
  @Type(() => TwitchUserData)
  userData: TwitchUserData;
}
