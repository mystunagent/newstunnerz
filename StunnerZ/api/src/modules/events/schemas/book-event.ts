import { Schema } from 'mongoose';

export const BookEventSchema = new Schema({
  performerId: String,
  eventId: String,
  status: {
    type: String,
    default: 'pending'
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
