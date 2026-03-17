import { HttpException, HttpStatus } from '@nestjs/common';

const BOOKING_STREAM_HAS_BEEN_EXPIRED = 'You have been booked this stream';

export class BookingStreamExpiredException extends HttpException {
  constructor(msg?: string) {
    super(msg || BOOKING_STREAM_HAS_BEEN_EXPIRED, HttpStatus.BAD_REQUEST);
  }
}
