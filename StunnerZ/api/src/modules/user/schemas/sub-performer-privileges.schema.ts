import * as mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export const subPerformerPrivilegeSchema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    index: true
  },
  privilege: String,
  value: String,
  commission: {
    type: Number,
    default: 0
  },
  showCommission: {
    type: Boolean,
    default: true
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
export const SubPerformerPrivilegeSchema = subPerformerPrivilegeSchema;
