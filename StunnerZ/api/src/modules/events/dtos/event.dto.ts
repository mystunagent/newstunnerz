import { Expose } from 'class-transformer';
import { pick } from 'lodash';
import { ObjectId } from 'mongodb';

export class EventScheduleDto {
  @Expose()
  _id: ObjectId | string;

  @Expose()
  performerIds: Array<string>;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  fileId: string;

  @Expose()
  mobile: string;

  @Expose()
  info: string;

  @Expose()
  image?: any;

  @Expose()
  booked?: any;

  @Expose()
  address: string;

  @Expose()
  price: number;

  @Expose()
  availability: number;

  @Expose()
  hosted: string;

  @Expose()
  status: string;

  @Expose()
  isPrivate: boolean;

  @Expose()
  startAt: Date;

  @Expose()
  endAt: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(init?: Partial<EventScheduleDto>) {
    Object.assign(this, pick(init, [
      '_id',
      'performerIds',
      'name',
      'email',
      'mobile',
      'status',
      'info',
      'image',
      'address',
      'hosted',
      'booked',
      'availability',
      'price',
      'fileId',
      'isPrivate',
      'startAt',
      'endAt',
      'createdAt',
      'updatedAt'
    ]));
  }
}
