import { HttpException, HttpStatus } from '@nestjs/common';

const EXISTED_BOOKING_STREAM = 'Stream booking has expired';

export class BookingStreamExistedException extends HttpException {
  constructor(msg?: string) {
    super(msg || EXISTED_BOOKING_STREAM, HttpStatus.BAD_REQUEST);
  }
}
