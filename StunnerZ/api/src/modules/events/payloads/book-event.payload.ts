import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { SearchRequest } from 'src/kernel';

export class BookEventScheduleCreatePayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  performerId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  eventId: string;
}

export class BookEventScheduleUpdatePayload extends BookEventScheduleCreatePayload {}

export class AdminBookEventScheduleSearchPayload extends SearchRequest {
  @ApiProperty()
  @IsString()
  @IsOptional()
  q: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  performerId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  status: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  eventId: string;
}
export class BookEventScheduleSearchPayload extends AdminBookEventScheduleSearchPayload {}