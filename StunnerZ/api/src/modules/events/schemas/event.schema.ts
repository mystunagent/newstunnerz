import { Schema } from 'mongoose';
import { STATUS } from '../constants';

export const EventSchema = new Schema({
  performerIds: {
    type: [{
      type: String
    }],
    default: []
  },
  name: {
    type: String
  },
  email: {
    type: String
  },
  mobile: {
    type: String
  },
  info: {
    type: String
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  fileId: {
    type: String
  },
  price: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    default: STATUS.ACTIVE
  },
  address: {
    type: String
  },
  hosted: {
    type: String
  },
  availability: {
    type: Number,
    min: 0,
    default: 0
  },
  startAt: {
    type: Date,
    default: Date.now
  },
  endAt: {
    type: Date,
    default: Date.now
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
