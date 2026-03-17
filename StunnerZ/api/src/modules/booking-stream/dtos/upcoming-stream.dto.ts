import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class UpcomingStreamDto {
  _id: ObjectId;

  performerId: ObjectId;

  startAt: Date;

  endAt: Date;

  optionStream?: string;

  title?: string;

  description?: string;

  price?: number;

  isSubscribed?: any;

  isFree?: boolean;

  status: string;

  performerInfo?: any;

  createdAt: Date;

  updatedAt: Date;

  constructor(data: Partial<UpcomingStreamDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'performerId',
        'performerInfo',
        'title',
        'description',
        'startAt',
        'isSubscribed',
        'status',
        'optionStream',
        'isFree',
        'price',
        'endAt',
        'createdAt',
        'updatedAt'
      ])
    );
  }

  toResponse(): Partial<UpcomingStreamDto> {
    return {
      _id: this._id,
      performerId: this.performerId,
      title: this.title,
      description: this.description,
      startAt: this.startAt,
      endAt: this.endAt,
      status: this.status,
      isFree: this.isFree,
      isSubscribed: this.isSubscribed,
      price: this.price,
      optionStream: this.optionStream,
      performerInfo: this.performerInfo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
