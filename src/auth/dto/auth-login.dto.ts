import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { EAuthenticationProviders } from 'src/common/enums/AuthenticationProviders';

export class AuthLoginDTO {
  @ApiProperty()
  @IsOptional()
  @IsEmail()
  public email?: string;

  @ApiProperty()
  @IsEnum(EAuthenticationProviders)
  public provider: EAuthenticationProviders;
}
