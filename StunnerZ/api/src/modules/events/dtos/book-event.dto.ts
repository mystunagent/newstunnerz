import { Expose } from 'class-transformer';
import { pick } from 'lodash';
import { ObjectId } from 'mongodb';

export class BookEventScheduleDto {
  @Expose()
  _id: ObjectId | string;

  @Expose()
  performerId: string;

  @Expose()
  eventId: string;

  @Expose()
  status: string;

  performerInfo?: any;

  eventInfo?: any;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(init?: Partial<BookEventScheduleDto>) {
    Object.assign(this, pick(init, [
      '_id',
      'performerId',
      'eventId',
      'performerInfo',
      'eventInfo',
      'status',
      'createdAt',
      'updatedAt'
    ]));
  }
}
