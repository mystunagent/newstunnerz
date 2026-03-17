import { ObjectId } from 'mongodb';
import { Schema } from 'mongoose';
import { UPCOMING_TIME_STREAM_STATUES, UpcomingTimeStreamStatus } from '../constants';

export const UpcomingStreamSchema = new Schema({
  performerId: {
    type: ObjectId,
    index: true
  },
  startAt: {
    type: Date,
    default: Date.now
  },
  endAt: {
    type: Date,
    default: Date.now
  },
  price: {
    type: Number,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: false
  },
  optionStream: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: UpcomingTimeStreamStatus.PENDING,
    enum: UPCOMING_TIME_STREAM_STATUES
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
