import * as mongoose from 'mongoose';

export const GroupEarningSchema = new mongoose.Schema({
  performerId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  subPerformerId: {
    type: String,
    index: true
  },
  // type of earning
  sourceType: {
    type: String,
    index: true
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  latestPayment: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updateAt: {
    type: Date,
    default: Date.now
  }
});
