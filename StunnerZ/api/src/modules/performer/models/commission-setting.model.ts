import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class CommissionSettingModel extends Document {
  performerId: ObjectId;

  monthlySubscriptionCommission: number;

  sixMonthSubscriptionCommission: number;

  oneTimeSubscriptionCommission: number;

  videoSaleCommission: number;

  gallerySaleCommission: number;

  productSaleCommission: number;

  feedSaleCommission: number;

  tipCommission: number;

  streamCommission: number;

  messageSaleCommission: number;

  createdAt: Date;

  updatedAt: Date;
}
