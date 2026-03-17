import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class EarningModel extends Document {
  transactionId: ObjectId;

  performerId: ObjectId;

  userId: ObjectId;

  subPerformerId: ObjectId;

  sourceType: string;

  type: string;

  totalPrice: number;

  grossPrice: number;

  subPerformerPrice: number;

  netPrice: number;

  siteCommission: number;

  subPerformerCommission: number;

  siteTransactionCost: number;

  isPaid: boolean;

  createdAt: Date;

  paidAt: Date;

  paymentGateway: string;

  isToken: boolean;

  referralFee: number;

  latestPayment: boolean;
}
