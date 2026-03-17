import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class SetUpTimeStreamDto {
  _id: ObjectId;

  performerId: ObjectId;

  startAt: Date;

  endAt: Date;

  status: 'active' | 'inactive' | 'booked';

  createdAt: Date;

  updatedAt: Date;

  constructor(data: Partial<SetUpTimeStreamDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'performerId',
        'startAt',
        'endAt',
        'status',
        'createdAt',
        'updatedAt'
      ])
    );
  }

  toResponse(): Partial<SetUpTimeStreamDto> {
    return {
      _id: this._id,
      performerId: this.performerId,
      startAt: this.startAt,
      endAt: this.endAt,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
