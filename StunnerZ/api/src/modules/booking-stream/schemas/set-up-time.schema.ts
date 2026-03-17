import { ObjectId } from 'mongodb';
import { Schema } from 'mongoose';
import { SETUP_TIME_STREAM_STATUES, SetUpTimeStreamStatus } from '../constants';

export const SetUpTimeStreamSchema = new Schema({
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
  status: {
    type: String,
    default: SetUpTimeStreamStatus.ACTIVE,
    enum: SETUP_TIME_STREAM_STATUES
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
