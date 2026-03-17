import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';
import { BookingStatus } from '../interfaces';

export class BookingStreamModel extends Document {
  userId: ObjectId;

  performerId: ObjectId;

  conversationId: ObjectId;

  locale: string;

  idSetUpTime: string;

  token: number;

  startAt: Date;

  endAt: Date;

  status: BookingStatus;

  createdAt: Date;

  updatedAt: Date;
}
