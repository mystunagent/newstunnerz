import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

export class UpcomingStreamModel extends Document {
  performerId: ObjectId;

  startAt: Date;

  endAt: Date;

  status: string;

  isFree: boolean;

  price: number;

  title: string;

  description: string;

  optionStream: string;

  createdAt: Date;

  updatedAt: Date;
}
