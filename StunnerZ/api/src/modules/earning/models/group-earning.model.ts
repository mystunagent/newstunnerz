import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class GroupEarningModel extends Document {
  performerId: ObjectId;

  sourceId: ObjectId;

  subPerformerId?: string;

  sourceType: string;

  isPaid: boolean;

  createdAt: Date;

  updateAt: Date;

  latestPayment: boolean;
}
