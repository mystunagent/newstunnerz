import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString
} from 'class-validator';
import { BOOKING_STREAM_STATUES, BookingStreamStatus } from '../constants';

export class CreateBookingPayload {
  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startAt?: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  endAt?: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  idTime?: string;
}

export class UpdateBookingPayload {
  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startAt: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  endAt: Date;
}

export class AdminUpdateBookingPayload extends UpdateBookingPayload {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsIn(BOOKING_STREAM_STATUES)
  status: BookingStreamStatus;
}
