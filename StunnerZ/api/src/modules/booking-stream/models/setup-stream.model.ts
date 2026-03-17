import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

export class SetUpTimeStreamModel extends Document {
  performerId: ObjectId;

  startAt: Date;

  endAt: Date;

  status: 'active' | 'inactive' | 'booked';

  createdAt: Date;

  updatedAt: Date;
}
