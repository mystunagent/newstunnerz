import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { EntityNotFoundException, PageableData } from 'src/kernel';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { UserService } from 'src/modules/user/services';
import { UserDto } from 'src/modules/user/dtos';
import moment = require('moment');
import { EarningModel } from '../models/earning.model';
import { EARNING_MODEL_PROVIDER, GROUP_EARNING_MODEL_PROVIDER, REFERRAL_EARNING_MODEL_PROVIDER } from '../providers/earning.provider';
import {
  EarningSearchRequestPayload,
  UpdateEarningStatusPayload
} from '../payloads';
import { PerformerService } from '../../performer/services';
import { EarningDto, IEarningStatResponse, IEarningResponse } from '../dtos/earning.dto';
import { PerformerDto } from '../../performer/dtos';
import { PaymentService } from '../../payment/services';
import { GroupEarningModel } from '../models/group-earning.model';
import { ReferralEarningModel } from '../models/referral-earning.model';
// import { SettingService } from 'src/modules/settings';

@Injectable()
export class EarningService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(GROUP_EARNING_MODEL_PROVIDER)
    private readonly groupEarningModel: Model<GroupEarningModel>,
    @Inject(EARNING_MODEL_PROVIDER)
    private readonly earningModel: Model<EarningModel>,
    private readonly paymentService: PaymentService,
    @Inject(REFERRAL_EARNING_MODEL_PROVIDER)
    private readonly referralEarningModel: Model<ReferralEarningModel>
    // private readonly bitsafeService: BitsafeService
  ) { }

  public async adminSearch(
    req: EarningSearchRequestPayload
  ): Promise<PageableData<EarningDto>> {
    if (req.fromDate === 'undefined') req.fromDate = null;
    if (req.toDate === 'undefined') req.toDate = null;
    const query = {} as any;
    if (req.performerId) {
      query.performerId = req.performerId;
    }
    if (req.transactionId) {
      query.transactionId = req.transactionId;
    }
    if (req.subPerformerId && req.subPerformerId !== '') {
      query.subPerformerId = { $in: [req.subPerformerId, null] };
    }
    if (req.sourceType) {
      query.sourceType = req.sourceType;
    }
    if (req.type) {
      query.type = req.type;
    }
    if (req.isToken) {
      query.isToken = req.isToken === 'true';
    }
    if (req.isPaid) {
      query.isPaid = req.isPaid;
    }

    const sort = {
      createdAt: -1
    } as any;

    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: new Date(req.fromDate),
        $lte: new Date(req.toDate)
      };
    }

    const [data, total] = await Promise.all([
      this.earningModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.earningModel.countDocuments(query)
    ]);
    const earnings = data.map((d) => new EarningDto(d));
    const PIds = data.map((d) => d.performerId);
    const UIds = data.map((d) => d.userId);
    const SIds = data.filter((s) => s.subPerformerId).map((d) => d.subPerformerId);
    const [users, performers, subPerformers] = await Promise.all([
      this.userService.findByIds(UIds) || [],
      this.performerService.findByIds(PIds) || [],
      this.userService.findByIds(SIds) || []
    ]);

    earnings.forEach((earning: EarningDto) => {
      const performer = earning.performerId && performers.find(
        (p) => p._id.toString() === earning.performerId.toString()
      );
      // eslint-disable-next-line no-param-reassign
      earning.performerInfo = performer
        ? new PerformerDto(performer).toResponse(true)
        : null;
      const user = earning.userId && users.find(
        (p) => p._id.toString() === earning.userId.toString()
      );
      // eslint-disable-next-line no-param-reassign
      earning.userInfo = user
        ? new UserDto(user).toResponse()
        : null;
      const subPerformer = earning.subPerformerId && subPerformers.find(
        (p) => p._id.toString() === earning.subPerformerId.toString()
      );
      earning.subPerformerInfo = subPerformer
      ? new UserDto(subPerformer).toResponse()
      : null;
    });

    // ?Hide referrer info and bitsafe
    // populate referrer info
    // const referrerIds = earnings.filter((e) => e.performerId && e.performerInfo)
    //   .map((e) => e.performerInfo)
    //   .filter((p) => p.referrerId)
    //   .map((p) => p.referrerId);
    // const [referrers, bitsafeAccounts] = await Promise.all([
    //   this.performerService.findByIds(referrerIds) || [],
    //   this.bitsafeService.findBySourceIds(referrerIds) || []
    // ]);
    // earnings.forEach((earning: EarningDto) => {
    //   const referrer = earning?.performerInfo?.referrerId && referrers.find(
    //     (p) => p._id.toString() === earning?.performerInfo?.referrerId.toString()
    //   );
    //   const bitsafeAccount = earning?.performerInfo?.referrerId && bitsafeAccounts.find(
    //     (a) => a.sourceId.toString() === earning?.performerInfo?.referrerId.toString()
    //   );
    //   if (earning.performerInfo) {
    //     // eslint-disable-next-line no-param-reassign
    //     earning.performerInfo.referrerInfo = referrer
    //       ? new PerformerDto(referrer).toResponse()
    //       : null;
    //     // eslint-disable-next-line no-param-reassign
    //     earning.performerInfo.referrerBitsafeAccount = bitsafeAccount ? {
    //       iban: bitsafeAccount.iban || null,
    //       publicToken: bitsafeAccount.publicToken || null
    //     } : {};
    //   }
    // });
    return {
      data: earnings,
      total
    };
  }

  public async search(
    req: EarningSearchRequestPayload,
    user: UserDto
  ): Promise<PageableData<IEarningResponse>> {
    if (req.fromDate === 'undefined') req.fromDate = null;
    if (req.toDate === 'undefined') req.toDate = null;

    const query = {
      performerId: user._id
    } as any;
    if (req.sourceType) {
      query.sourceType = req.sourceType;
    }
    if (req.subPerformerId && req.subPerformerId !== '') {
      query.subPerformerId = { $in: [req.subPerformerId, null] };
    }
    if (req.type) {
      query.type = req.type;
    }
    if (req.isToken) {
      query.isToken = req.isToken === 'true';
    }
    if (req.isPaid) {
      query.isPaid = req.isPaid;
    }
    const sort = {
      createdAt: -1
    } as any;

    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: new Date(req.fromDate),
        $lte: new Date(req.toDate)
      };
    }

    const [data, total] = await Promise.all([
      this.earningModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.earningModel.countDocuments(query)
    ]);
    const earnings = data.map((d) => new EarningDto(d).toResponse(false));
    const UIds = data.map((d) => d.userId);
    const [users] = await Promise.all([
      this.userService.findByIds(UIds) || []
    ]);

    earnings.forEach((earning: IEarningResponse) => {
      const u = earning.userId && users.find(
        (p) => p._id.toString() === earning.userId.toString()
      );
      // eslint-disable-next-line no-param-reassign
      earning.userInfo = u
        ? new UserDto(u).toResponse()
        : null;
    });
    return {
      data: earnings,
      total
    };
  }

  public async details(id: string) {
    const earning = await this.earningModel.findById(toObjectId(id));
    const transaction = await this.paymentService.findById(
      earning.transactionId
    );
    if (!earning || !transaction) {
      throw new EntityNotFoundException();
    }
    const [user, performer] = await Promise.all([
      this.userService.findById(earning.userId),
      this.performerService.findById(earning.performerId)
    ]);
    const data = new EarningDto(earning);
    data.userInfo = user ? new UserDto(user).toResponse(true, true) : null;
    data.performerInfo = performer
      ? new PerformerDto(performer).toResponse(true, true)
      : null;
    data.transactionInfo = transaction;
    return data;
  }

  public async adminStats(
    req: EarningSearchRequestPayload
  ): Promise<IEarningStatResponse> {
    if (req.fromDate === 'undefined') req.fromDate = null;
    if (req.toDate === 'undefined') req.toDate = null;

    const query = {} as any;
    if (req.performerId) {
      query.performerId = toObjectId(req.performerId);
    }
    if (req.transactionId) {
      query.transactionId = req.transactionId;
    }
    if (req.sourceType) {
      query.sourceType = req.sourceType;
    }
    if (req.type) {
      query.type = req.type;
    }
    if (req.isToken) {
      query.isToken = req.isToken === 'true';
    }
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: new Date(req.fromDate),
        $lte: new Date(req.toDate)
      };
    }
    const [totalGrossPrice, totalNetPrice, totalTransactionCost] = await Promise.all([
      this.earningModel.aggregate([
        { $match: query }, { $group: { _id: null, total: { $sum: '$grossPrice' } } }
      ]),
      this.earningModel.aggregate([
        { $match: query }, { $group: { _id: null, total: { $sum: '$netPrice' } } }
      ]),
      this.earningModel.aggregate([
        { $match: query }, { $group: { _id: null, total: { $sum: '$transactionCost' } } }
      ])
    ]);
    const totalTransactionPrice = (totalTransactionCost && totalTransactionCost.length && totalTransactionCost[0].total) || 0;
    const totalGross = (totalGrossPrice && totalGrossPrice.length && totalGrossPrice[0].total) || 0;
    const totalNet = (totalNetPrice && totalNetPrice.length && totalNetPrice[0].total) || 0;
    const totalSiteCommission = totalGross && totalNet ? (totalGross - totalNet) : 0;
    return {
      totalGrossPrice: totalGross + totalTransactionPrice,
      totalNetPrice: totalNet,
      totalSiteCommission: totalSiteCommission + totalTransactionPrice,
      totalTransactionCost: totalTransactionPrice
    };
  }

  public async stats(
    req: EarningSearchRequestPayload
  ): Promise<IEarningStatResponse> {
    if (req.fromDate === 'undefined') req.fromDate = null;
    if (req.toDate === 'undefined') req.toDate = null;

    const query = {} as any;
    if (req.performerId) {
      query.performerId = toObjectId(req.performerId);
    }
    if (req.transactionId) {
      query.transactionId = req.transactionId;
    }
    if (req.sourceType) {
      query.sourceType = req.sourceType;
    }
    if (req.type) {
      query.type = req.type;
    }
    if (req.isToken) {
      query.isToken = req.isToken === 'true';
    }
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: new Date(req.fromDate),
        $lte: new Date(req.toDate)
      };
    }
    const [totalGrossPrice, totalNetPrice] = await Promise.all([
      this.earningModel.aggregate([
        { $match: query }, { $group: { _id: null, total: { $sum: '$grossPrice' } } }
      ]),
      this.earningModel.aggregate([
        { $match: query }, { $group: { _id: null, total: { $sum: '$netPrice' } } }
      ]),
      this.earningModel.aggregate([
        { $match: { ...query, ispaid: true } }, { $group: { _id: null, total: { $sum: '$transactionCost' } } }
      ]),
      this.earningModel.aggregate([
        { $match: { ...query, ispaid: false } }, { $group: { _id: null, total: { $sum: '$transactionCost' } } }
      ])
    ]);
    const totalGross = (totalGrossPrice && totalGrossPrice.length && totalGrossPrice[0].total) || 0;
    const totalNet = (totalNetPrice && totalNetPrice.length && totalNetPrice[0].total) || 0;
    const totalSiteCommission = totalGross - totalNet;
    return {
      totalGrossPrice: totalGross,
      totalNetPrice: totalNet,
      totalSiteCommission
    };
  }

  public async updatePaidStatus(
    payload: UpdateEarningStatusPayload
  ): Promise<any> {
    if (!payload.fromDate || payload.fromDate === 'undefined') throw new Error('Date invalid');
    if (!payload.toDate || payload.toDate === 'undefined') throw new Error('Date invalid');
    const query = {} as any;
    if (payload.fromDate && payload.toDate) {
      query.createdAt = {
        $gt: new Date(payload.fromDate),
        $lte: new Date(payload.toDate)
      };
    }

    if (payload.performerId) {
      query.performerId = payload.performerId;
    }

    return this.earningModel.updateMany(query, {
      $set: { isPaid: !query.isPaid, paidAt: new Date() }
    });
  }

  public async performersStat(
    performerId: string | ObjectId,
    req: any
  ): Promise<any> {
    const sort = {
      paidAt: 'desc'
    };
    const query = {
      performerId: toObjectId(performerId),
      isPaid: true
    } as any;
    if (req?.paymentAt) {
      query.paidAt = {
        $gt: moment(req.paymentAt).startOf('day').toDate(),
        $lte: moment(req.paymentAt).endOf('day').toDate()
      };
    }
    if (req?.fromDate && req?.toDate) {
      query.paidAt = {
        $gt: moment(req.fromDate).startOf('day').toDate(),
        $lte: moment(req.toDate).endOf('day').toDate()
      };
    }
    const [
      totalEarnedTokens,
      totalReferralEarnedToken,
      totalReferralEarnedMoney,
      totalRefPaidToken,
      totalRefUnpaidToken,
      totalPaidTokens,
      totalUnpaidTokens,
      totalNotRefLatestPayment,
      totalRefLatestPayment,
      latestPaymentReft,
      latestPaymentNotReft
    ] = await Promise.all([
      this.earningModel.aggregate([
        {
          $match: {
            performerId: toObjectId(performerId)
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$netPrice'
            }
          }
        }
      ]),
      this.referralEarningModel.aggregate([
        {
          $match: {
            referralId: toObjectId(performerId),
            isToken: true
          }
        },
        { $group: { _id: null, total: { $sum: '$netPrice' } } }
      ]),
      this.referralEarningModel.aggregate([
        {
          $match: {
            referralId: toObjectId(performerId),
            isToken: false
          }
        },
        { $group: { _id: null, total: { $sum: '$netPrice' } } }
      ]),
      this.referralEarningModel.aggregate([
        {
          $match: {
            referralSource: 'performer',
            referralId: toObjectId(performerId),
            isToken: true,
            isPaid: true
          }
        },
        { $group: { _id: null, total: { $sum: '$netPrice' } } }
      ]),
      this.referralEarningModel.aggregate([
        {
          $match: {
            referralSource: 'performer',
            referralId: toObjectId(performerId),
            isToken: true,
            isPaid: false
          }
        },
        { $group: { _id: null, total: { $sum: '$netPrice' } } }
      ]),
      this.earningModel.aggregate([
        {
          $match: {
            performerId: toObjectId(performerId),
            isPaid: true
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$netPrice'
            }
          }
        }
      ]),
      this.earningModel.aggregate([
        {
          $match: {
            performerId: toObjectId(performerId),
            isPaid: false
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$netPrice'
            }
          }
        }
      ]),
      this.earningModel.aggregate([
        {
          $match: {
            performerId: toObjectId(performerId),
            isPaid: true,
            latestPayment: true
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$netPrice'
            }
          }
        }
      ]),
      this.referralEarningModel.aggregate([
        {
          $match: {
            referralSource: 'performer',
            referralId: toObjectId(performerId),
            isToken: true,
            isPaid: false
          }
        },
        { $group: { _id: null, total: { $sum: '$netPrice' } } }
      ]),
      this.earningModel
        .findOne(query).sort(sort),
      this.referralEarningModel
        .findOne({ ...query, referralSource: 'performer', isToken: true }).sort(sort)
    ]);
    const totalEarned = (totalEarnedTokens && totalEarnedTokens.length && totalEarnedTokens[0].total) || 0;
    const totalRefEarnedToken = (totalReferralEarnedToken && totalReferralEarnedToken.length && totalReferralEarnedToken[0]?.total) || 0;
    const totalRefEarnedMoney = (totalReferralEarnedMoney && totalReferralEarnedMoney.length && totalReferralEarnedMoney[0]?.total) || 0;

    const totalRefPaid = (totalRefPaidToken && totalRefPaidToken.length && totalRefPaidToken[0].total) || 0;
    const totalRefUnpaid = (totalRefUnpaidToken && totalRefUnpaidToken.length && totalRefUnpaidToken[0].total) || 0;

    const totalNotReftLatestPayment = (totalNotRefLatestPayment && totalNotRefLatestPayment.length && totalNotRefLatestPayment[0].total) || 0;
    const totalReftLatestPaymentAmount = (totalRefLatestPayment && totalRefLatestPayment.length && totalRefLatestPayment[0].total) || 0;

    const totalPaidAmountNotRef = (totalPaidTokens && totalPaidTokens.length && totalPaidTokens[0].total) || 0;
    const totalUnpaidAmountNotRef = (totalUnpaidTokens && totalUnpaidTokens.length && totalUnpaidTokens[0].total) || 0;
    const totalLatestPaymentAmount = totalNotReftLatestPayment + totalReftLatestPaymentAmount;

    const latestPaymentDate = latestPaymentReft?.paidAt || latestPaymentNotReft?.paidAt || null;

    return {
      performerId,
      totalEarnedTokens: totalEarned + totalRefEarnedToken,
      totalReferralEarnedToken: totalRefEarnedToken,
      totalReferralEarnedMoney: totalRefEarnedMoney,
      totalPaidAmount: totalPaidAmountNotRef + totalRefPaid,
      totalUnpaidAmount: totalUnpaidAmountNotRef + totalRefUnpaid,
      totalLatestPaymentAmount,
      latestPaymentDate
    };
  }

  public async subPerformersStat(
    performerId: string | ObjectId,
    req: any
  ): Promise<any> {
    const sort = {
      paidAt: 'desc'
    };
    const query = {
      subPerformerId: toObjectId(performerId),
      isPaid: true
    } as any;
    if (req?.paymentAt) {
      query.paidAt = {
        $gt: moment(req.paymentAt).startOf('day').toDate(),
        $lte: moment(req.paymentAt).endOf('day').toDate()
      };
    }
    if (req?.fromDate && req?.toDate) {
      query.paidAt = {
        $gt: moment(req.fromDate).startOf('day').toDate(),
        $lte: moment(req.toDate).endOf('day').toDate()
      };
    }
    const [
      totalEarnedTokens,
      totalReferralEarnedToken,
      totalReferralEarnedMoney,
      totalRefPaidToken,
      totalRefUnpaidToken,
      totalPaidTokens,
      totalUnpaidTokens,
      totalNotRefLatestPayment,
      totalRefLatestPayment,
      latestPaymentReft,
      latestPaymentNotReft
    ] = await Promise.all([
      this.earningModel.aggregate([
        {
          $match: {
            subPerformerId: toObjectId(performerId)
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$subPerformerPrice'
            }
          }
        }
      ]),
      this.referralEarningModel.aggregate([
        {
          $match: {
            subPerformerId: toObjectId(performerId),
            isToken: true
          }
        },
        { $group: { _id: null, total: { $sum: '$subPerformerPrice' } } }
      ]),
      this.referralEarningModel.aggregate([
        {
          $match: {
            subPerformerId: toObjectId(performerId),
            isToken: false
          }
        },
        { $group: { _id: null, total: { $sum: '$subPerformerPrice' } } }
      ]),
      this.referralEarningModel.aggregate([
        {
          $match: {
            referralSource: 'performer',
            subPerformerId: toObjectId(performerId),
            isToken: true,
            isPaid: true
          }
        },
        { $group: { _id: null, total: { $sum: '$subPerformerPrice' } } }
      ]),
      this.referralEarningModel.aggregate([
        {
          $match: {
            referralSource: 'performer',
            subPerformerId: toObjectId(performerId),
            isToken: true,
            isPaid: false
          }
        },
        { $group: { _id: null, total: { $sum: '$subPerformerPrice' } } }
      ]),
      this.earningModel.aggregate([
        {
          $match: {
            subPerformerId: toObjectId(performerId),
            isPaid: true
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$subPerformerPrice'
            }
          }
        }
      ]),
      this.earningModel.aggregate([
        {
          $match: {
            subPerformerId: toObjectId(performerId),
            isPaid: false
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$subPerformerPrice'
            }
          }
        }
      ]),
      this.earningModel.aggregate([
        {
          $match: {
            subPerformerId: toObjectId(performerId),
            isPaid: true,
            latestPayment: true
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$subPerformerPrice'
            }
          }
        }
      ]),
      this.referralEarningModel.aggregate([
        {
          $match: {
            referralSource: 'performer',
            referralId: toObjectId(performerId),
            isToken: true,
            isPaid: false
          }
        },
        { $group: { _id: null, total: { $sum: '$subPerformerPrice' } } }
      ]),
      this.earningModel
        .findOne(query).sort(sort),
      this.referralEarningModel
        .findOne({ ...query, referralSource: 'performer', isToken: true }).sort(sort)
    ]);
    const totalEarned = (totalEarnedTokens && totalEarnedTokens.length && totalEarnedTokens[0].total) || 0;
    const totalRefEarnedToken = (totalReferralEarnedToken && totalReferralEarnedToken.length && totalReferralEarnedToken[0]?.total) || 0;
    const totalRefEarnedMoney = (totalReferralEarnedMoney && totalReferralEarnedMoney.length && totalReferralEarnedMoney[0]?.total) || 0;

    const totalRefPaid = (totalRefPaidToken && totalRefPaidToken.length && totalRefPaidToken[0].total) || 0;
    const totalRefUnpaid = (totalRefUnpaidToken && totalRefUnpaidToken.length && totalRefUnpaidToken[0].total) || 0;

    const totalNotReftLatestPayment = (totalNotRefLatestPayment && totalNotRefLatestPayment.length && totalNotRefLatestPayment[0].total) || 0;
    const totalReftLatestPaymentAmount = (totalRefLatestPayment && totalRefLatestPayment.length && totalRefLatestPayment[0].total) || 0;

    const totalPaidAmountNotRef = (totalPaidTokens && totalPaidTokens.length && totalPaidTokens[0].total) || 0;
    const totalUnpaidAmountNotRef = (totalUnpaidTokens && totalUnpaidTokens.length && totalUnpaidTokens[0].total) || 0;
    const totalLatestPaymentAmount = totalNotReftLatestPayment + totalReftLatestPaymentAmount;

    const latestPaymentDate = latestPaymentReft?.paidAt || latestPaymentNotReft?.paidAt || null;

    return {
      performerId,
      totalEarnedTokens: totalEarned + totalRefEarnedToken,
      totalReferralEarnedToken: totalRefEarnedToken,
      totalReferralEarnedMoney: totalRefEarnedMoney,
      totalPaidAmount: totalPaidAmountNotRef + totalRefPaid,
      totalUnpaidAmount: totalUnpaidAmountNotRef + totalRefUnpaid,
      totalLatestPaymentAmount,
      latestPaymentDate
    };
  }

  // get total Earning Live stream
  // public async performersStatStream(
  //   query: any
  // ): Promise<any> {
  //   const totalEarnGrossPrice = await
  //     this.earningModel.aggregate([
  //       { $match: query }, { $group: { _id: null, total: { $sum: '$grossPrice' } } }
  //     ]);

  //   const totalEarningStream = (totalEarnGrossPrice
  //     && totalEarnGrossPrice.length && totalEarnGrossPrice[0].total) || 0;

  //   return totalEarningStream;
  // }
}
