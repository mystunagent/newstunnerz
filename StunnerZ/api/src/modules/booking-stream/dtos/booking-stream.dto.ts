import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { BookingStatus } from '../interfaces';

export class BookingStreamDto {
  _id: ObjectId;

  userId: ObjectId;

  userInfo: any;

  performerId: ObjectId;

  performerInfo: any;

  conversationId: ObjectId;

  url: string;

  locale: string;

  idSetUpTime: string;

  token: number;

  startAt: Date;

  endAt: Date;

  status: BookingStatus;

  createdAt: Date;

  updatedAt: Date;

  constructor(data: Partial<BookingStreamDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'userId',
        'performerId',
        'conversationId',
        'performerInfo',
        'userInfo',
        'url',
        'locale',
        'idSetUpTime',
        'token',
        'startAt',
        'endAt',
        'status',
        'createdAt',
        'updatedAt'
      ])
    );
  }

  toResponse(): Partial<BookingStreamDto> {
    return {
      _id: this._id,
      userId: this.userId,
      performerId: this.performerId,
      userInfo: this.userInfo,
      performerInfo: this.performerInfo,
      conversationId: this.conversationId,
      url: this.url,
      locale: this.locale,
      idSetUpTime: this.idSetUpTime,
      token: this.token,
      startAt: this.startAt,
      endAt: this.endAt,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
