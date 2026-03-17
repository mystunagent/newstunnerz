import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString
} from 'class-validator';
import { SearchRequest } from 'src/kernel';

export class CreateUpcomingStreamPayload {
  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startAt: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  endAt: Date;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  price: number;

  @ApiProperty()
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
}

export class UpdateUpcomingStreamPayload extends CreateUpcomingStreamPayload {}
export class UpcomingStreamSearchPayload extends SearchRequest {
  @ApiProperty()
  @IsOptional()
  @IsString()
  performerId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  startAt: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  endAt: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  status: string;
}
