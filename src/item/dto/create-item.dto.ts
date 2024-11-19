import { IsBoolean, IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsBoolean()
  @IsOptional()
  isHidden = false;

  @IsNumber()
  @IsOptional()
  quantity = 1;

  @IsString()
  @IsOptional()
  input?: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsNumber()
  @IsOptional()
  cooldown = 0;

  @IsBoolean()
  @IsOptional()
  inputRequired = false;
}
