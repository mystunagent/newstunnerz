import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class GroupEarningDto {
  _id: ObjectId;

  source: any;

  sourceId: ObjectId;

  sourceType: string;

  createdAt: Date;

  userId?: ObjectId;

  userInfo?: any;

  performerId: ObjectId;

  subPerformerId: ObjectId;

  performerInfo?: any;

  subPerformerInfo?: any;

  isPaid: boolean;

  updateAt: Date;

  latestPayment?: boolean;

  constructor(data: Partial<GroupEarningDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'source',
        'sourceId',
        'sourceType',
        'createdAt',
        'userId',
        'userInfo',
        'performerId',
        'subPerformerId',
        'performerInfo',
        'subPerformerInfo',
        'isPaid',
        'updateAt',
        'latestPayment'
      ])
    );
  }
}

export interface IGroupEarningStatResponse {
  /**
   * Admin will spend for referral earning
   * Eg: Total price is $10
   * Performer earned $8
   * Referral earned $0.2
   * Admin earned $2 (commission 20%) - $0.2 (paid for referral) = $1.8
   */
  totalGrossPrice: number; // total price
  totalNetPrice: number; // performer earning stats + referral earning stats
  totalSiteCommission: number; // admin earning stats: totalGrossPrice - totalNetPrice
  // totalRefNetPrice: number; // referral earning stats
  totalPaidAmount: number;
  totalUnpaidAmount: number;
  totalSubAmount?: number;
}
