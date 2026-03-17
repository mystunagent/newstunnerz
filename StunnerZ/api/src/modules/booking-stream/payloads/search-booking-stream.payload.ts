import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { SearchRequest } from 'src/kernel';
import { SEARCH_BOOKING_STREAM_STATUES } from '../constants';
import { SearchBookingStatus } from '../interfaces';

export class BookingSearchPayload extends SearchRequest {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsIn(SEARCH_BOOKING_STREAM_STATUES)
  status?: SearchBookingStatus;

  @ApiProperty()
  @IsOptional()
  @IsString()
  startAt: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  endAt: string;
}

export class UserBookingSearchPayload extends BookingSearchPayload {
  @ApiProperty()
  @IsOptional()
  @IsString()
  performerId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  userId?: string;
}

export class PerformerBookingSearchPayload extends BookingSearchPayload {
  @ApiProperty()
  @IsOptional()
  @IsString()
  performerId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  conversationId?: string;
}

export class AdminBookingSearchPayload extends BookingSearchPayload {
  @ApiProperty()
  @IsOptional()
  @IsString()
  performerId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  userId?: string;
}
