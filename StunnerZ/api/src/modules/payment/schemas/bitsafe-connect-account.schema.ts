import { Schema } from 'mongoose';

export const BitsafeAccountConnectSchema = new Schema({
  // user, model, etc...
  source: {
    type: String,
    index: true
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  platformConnectId: {
    type: String
  },
  publicToken: {
    type: String
  },
  email: {
    type: String
  },
  iban: {
    type: String
  },
  signature: {
    type: String
  },
  metaData: {
    type: Schema.Types.Mixed
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
