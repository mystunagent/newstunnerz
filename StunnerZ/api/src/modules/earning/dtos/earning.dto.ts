import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export interface IEarningResponse {
  _id?: ObjectId;
  userId: ObjectId;
  userInfo: any;
  transactionId?: ObjectId;
  subPerformerId?: ObjectId;
  transactionInfo?: any;
  performerId: ObjectId;
  performerInfo: any;
  subPerformerInfo: any;
  sourceType?: string;
  type?: string;
  totalPrice?: number;
  grossPrice: number;
  subPerformerPrice: number;
  netPrice: number;
  siteCommission: number;
  subPerformerCommission: number;
  transactionCost?: number;
  isPaid?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  paidAt?: Date;
  transactionStatus?: string;
  isToken?: boolean;
  referralFee?: number;
  latestPayment?: boolean;
}
export class EarningDto {
  _id: ObjectId;

  userId: ObjectId;

  userInfo?: any;

  transactionId: ObjectId;

  subPerformerId: ObjectId;

  transactionInfo?: any;

  performerId: ObjectId;

  performerInfo?: any;

  subPerformerInfo?: any;

  sourceType: string;

  type: string;

  totalPrice?: number;

  grossPrice: number;

  subPerformerPrice: number;

  netPrice: number;

  siteCommission: number;

  subPerformerCommission: number;

  transactionCost?: number;

  isPaid?: boolean;

  createdAt: Date;

  updatedAt: Date;

  paidAt: Date;

  paymentGateway?: string;

  isToken?: boolean;

  referralFee?: number;

  latestPayment?: boolean;

  constructor(data?: Partial<EarningDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'userId',
        'userInfo',
        'transactionId',
        'transactionInfo',
        'performerId',
        'performerInfo',
        'subPerformerInfo',
        'sourceType',
        'type',
        'totalPrice',
        'grossPrice',
        'netPrice',
        'isPaid',
        'siteCommission',
        'transactionCost',
        'subPerformerId',
        'subPerformerPrice',
        'subPerformerCommission',
        'createdAt',
        'updatedAt',
        'paidAt',
        'paymentGateway',
        'isToken',
        'referralFee',
        'latestPayment'
      ])
    );
  }

  toResponse(includePrivateInfo = false, isAdmin?: boolean) {
    const publicInfo = {
      _id: this._id,
      userId: this.userId,
      userInfo: this.userInfo,
      performerId: this.performerId,
      subPerformerId: this.subPerformerId,
      performerInfo: this.performerInfo,
      subPerformerInfo: this.subPerformerInfo,
      type: this.type,
      grossPrice: this.grossPrice,
      netPrice: this.netPrice,
      subPerformerPrice: this.subPerformerPrice,
      siteCommission: this.siteCommission,
      subPerformerCommission: this.subPerformerCommission,
      isPaid: this.isPaid,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isToken: this.isToken,
      referralFee: this.referralFee,
      latestPayment: this.latestPayment
    };

    const privateInfo = {
      transactionId: this.transactionId,
      transactionInfo: this.transactionInfo,
      sourceType: this.sourceType,
      paidAt: this.paidAt,
      totalPrice: this.totalPrice,
      transactionCost: this.transactionCost
    };

    if (isAdmin) {
      return {
        ...publicInfo,
        ...privateInfo
      };
    }

    if (!includePrivateInfo) {
      return publicInfo;
    }

    return {
      ...publicInfo,
      ...privateInfo
    };
  }
}

export interface IEarningStatResponse {
  totalGrossPrice: number;
  totalNetPrice: number;
  totalSiteCommission: number;
  totalTransactionCost?: number;
}
