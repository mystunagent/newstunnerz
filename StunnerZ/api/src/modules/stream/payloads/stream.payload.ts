import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsBoolean
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartStreamPayload {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  price: number;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isFree: boolean = false;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  optionStream: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsOptional()
  upcomingId?: string;

  @ApiProperty()
  @IsOptional()
  upcoming?: boolean;
}

export class UpdateStreamPayload {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  price: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isFree: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  optionStream: string;
}
