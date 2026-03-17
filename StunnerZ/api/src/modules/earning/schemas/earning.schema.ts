import * as mongoose from 'mongoose';

export const EarningSchema = new mongoose.Schema({
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  performerId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  subPerformerId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  // group of item and rename
  sourceType: {
    type: String,
    index: true
  },
  // from details of item
  type: {
    type: String,
    index: true
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  grossPrice: {
    type: Number,
    default: 0
  },
  netPrice: {
    type: Number,
    default: 0
  },
  subPerformerPrice: {
    type: Number,
    default: 0
  },
  siteCommission: {
    type: Number,
    default: 0
  },
  subPerformerCommission: {
    type: Number,
    default: 0
  },
  transactionCost: {
    type: Number,
    default: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  },
  latestPayment: {
    type: Boolean,
    default: false
  },
  paymentGateway: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isToken: {
    type: Boolean,
    default: true
  },
  referralFee: {
    type: Number,
    default: 0
  }
});
