import { IsBoolean, IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class UpdateItemDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  price?: number;

  @IsBoolean()
  @IsOptional()
  isHidden?: boolean;

  @IsNumber()
  @IsOptional()
  quantity = 1;

  @IsString()
  @IsOptional()
  input?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  image?: string;

  @IsNumber()
  @IsOptional()
  cooldown?: number;

  @IsBoolean()
  @IsOptional()
  inputRequired?: boolean;
}
