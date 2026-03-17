import { ApiProperty } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional, IsBoolean, ValidateIf, IsNumber, IsDateString, IsIn
} from 'class-validator';
import { SearchRequest } from 'src/kernel';
import { STATUS } from '../constants';

export class EventScheduleCreatePayload {
  @ApiProperty()
  @IsString({ each: true })
  @IsOptional()
  performerIds: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fileId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  mobile: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  hosted: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  availability: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  address: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  info: string;

  @ApiProperty()
  @IsOptional()
  isPrivate: boolean;

  @ApiProperty()
  @IsOptional()
  price: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startAt: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  endAt: Date;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsIn([STATUS.ACTIVE, STATUS.INACTIVE])
  status: string;
}

export class EventScheduleUpdatePayload extends EventScheduleCreatePayload {}
export class AdminEventScheduleCreatePayload extends EventScheduleCreatePayload {}
export class AdminEventScheduleUpdatePayload extends AdminEventScheduleCreatePayload {}

export class EventScheduleSearchPayload extends SearchRequest {
  @ApiProperty()
  @IsString()
  @IsOptional()
  q: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  performerId: string;

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
  isPrivate: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsIn([STATUS.ACTIVE, STATUS.INACTIVE])
  status: string;
}
