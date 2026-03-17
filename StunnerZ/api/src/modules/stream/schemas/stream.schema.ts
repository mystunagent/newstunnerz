import { Schema } from 'mongoose';
import { ObjectId } from 'mongodb';

export const StreamSchema = new Schema({
  performerId: { type: ObjectId, index: true },
  type: { type: String, index: true },
  sessionId: { type: String, index: true },
  isStreaming: { type: Number, default: 0 },
  optionStream: { type: String },
  lastStreamingTime: Date,
  streamingTime: {
    type: Number,
    default: 0
  },
  stats: {
    members: { type: Number, default: 0 },
    likes: { type: Number, default: 0 }
  },
  isFree: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  totalPurchased: {
    type: Number,
    default: 0
  },
  title: String,
  description: {
    type: String,
    default: ''
  },
  waiting: {
    type: Boolean,
    default: false
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  refId: { type: ObjectId, index: true },
  includeIds: [{ type: ObjectId, index: true }]
});
