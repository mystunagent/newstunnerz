import { HttpException, HttpStatus } from '@nestjs/common';

const INVALID_DATE_RANGER_EXCEPTION = 'Please choose a valid time range';

export class InvalidDateRangerException extends HttpException {
  constructor(msg?: string) {
    super(msg || INVALID_DATE_RANGER_EXCEPTION, HttpStatus.BAD_REQUEST);
  }
}
