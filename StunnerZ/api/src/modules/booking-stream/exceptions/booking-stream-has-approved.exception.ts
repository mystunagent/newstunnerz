import { HttpException, HttpStatus } from '@nestjs/common';

const BOOKING_STREAM_HAS_BEEN_APPROVED = 'Booking stream has been approved';

export class BookingAppointmentApprovedException extends HttpException {
  constructor(msg?: string) {
    super(msg || BOOKING_STREAM_HAS_BEEN_APPROVED, HttpStatus.BAD_REQUEST);
  }
}
