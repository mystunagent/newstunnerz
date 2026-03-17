import { ObjectId } from 'mongodb';
import { Schema } from 'mongoose';
import { BOOKING_STREAM_STATUES, BookingStreamStatus } from '../constants';

export const BookingStreamSchema = new Schema({
  userId: {
    type: ObjectId,
    index: true
  },
  performerId: {
    type: ObjectId,
    index: true
  },
  conversationId: {
    type: ObjectId,
    index: true
  },
  locale: String,
  idSetUpTime: String,
  token: {
    type: Number,
    default: 1
  },
  startAt: {
    type: Date,
    default: Date.now
  },
  endAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: BookingStreamStatus.PENDING,
    enum: BOOKING_STREAM_STATUES
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
