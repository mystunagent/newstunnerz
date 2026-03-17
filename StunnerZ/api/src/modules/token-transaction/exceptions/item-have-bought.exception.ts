import { HttpException } from '@nestjs/common';

export class ItemHaveBoughtException extends HttpException {
  constructor() {
    super('Item have bought', 422);
  }
}
