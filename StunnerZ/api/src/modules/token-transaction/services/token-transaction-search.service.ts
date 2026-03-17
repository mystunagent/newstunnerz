import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PerformerService } from 'src/modules/performer/services';
import { Model } from 'mongoose';
import * as moment from 'moment';
import { uniq } from 'lodash';
import { UserDto } from 'src/modules/user/dtos';
import { UserService } from 'src/modules/user/services';
import { PAYMENT_TOKEN_MODEL_PROVIDER } from '../providers';
import { TokenTransactionModel } from '../models';
import { PaymentTokenSearchPayload } from '../payloads';
import { TokenTransactionDto } from '../dtos';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';

@Injectable()
export class TokenTransactionSearchService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => SettingService))
    private readonly settingService: SettingService,
    @Inject(PAYMENT_TOKEN_MODEL_PROVIDER)
    private readonly paymentTokenModel: Model<TokenTransactionModel>
  ) {}

  public async getUserTransactionsToken(
    req: PaymentTokenSearchPayload,
    user: UserDto
  ) {
    const query = {
      source: 'user',
      sourceId: user._id
    } as any;
    if (req.type) query.type = req.type;
    if (req.status) query.status = req.status;
    if (req.performerId) query.performerId = req.performerId;
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: moment(req.fromDate).startOf('day'),
        $lt: moment(req.toDate).endOf('day')
      };
    }
    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || -1
    };
    const [data, total] = await Promise.all([
      this.paymentTokenModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.paymentTokenModel.countDocuments(query)
    ]);
    const performerIds = uniq(data.map((d) => d.performerId));
    const [performers] = await Promise.all([
      this.performerService.findByIds(performerIds)
    ]);
    const transactions = data.map((d) => new TokenTransactionDto(d).toResponse(true));
    transactions.forEach((transaction) => {
      if (transaction.performerId) {
        const performerInfo = performers.find((t) => t._id.toString() === transaction.performerId.toString());
        if (performerInfo) {
          // eslint-disable-next-line no-param-reassign
          transaction.performerInfo = performerInfo.toResponse();
        }
      }
    });
    return {
      total,
      data: transactions
    };
  }

  public async adminGetUserTransactionsToken(req: PaymentTokenSearchPayload) {
    const query = {} as any;
    if (req.sourceId) query.sourceId = req.sourceId;
    if (req.source) query.source = req.source;
    if (req.type) query.type = req.type;
    if (req.status) query.status = req.status;
    if (req.target) query.target = req.target;
    if (req.targetId) query.targetId = req.targetId;
    if (req.performerId) query.performerId = req.performerId;
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: moment(req.fromDate).startOf('day'),
        $lt: moment(req.toDate).endOf('day')
      };
    }
    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || -1
    };
    const [data, total] = await Promise.all([
      this.paymentTokenModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.paymentTokenModel.countDocuments(query)
    ]);
    const sourceIds = data.map((d) => d.sourceId);
    const performerIds = data.map((d) => d.performerId);
    const [users, performers] = await Promise.all([
      this.userService.findByIds(sourceIds),
      this.performerService.findByIds(performerIds)
    ]);
    const adminCommission = SettingService.getValueByKey(SETTING_KEYS.PRIVATE_STREAM_COMMISSION);
    let commission = 0;
    const transactions = data.map((transaction) => {
      const sourceInfo = transaction.sourceId && users.find((t) => t._id.toString() === transaction.sourceId.toString());
      const performerInfo = transaction.performerId && performers.find((t) => t._id.toString() === transaction.performerId.toString());
      if(transaction?.type === 'private_chat') {
        commission = adminCommission;
      }else {
        commission = 0;
      }
      return {
        ...transaction,
        sourceInfo: sourceInfo && sourceInfo.toResponse(),
        performerInfo: performerInfo && performerInfo.toResponse(),
        adminCommissionPrivateStream: commission
      };
    });
    return {
      total,
      data: transactions.map((trans) => new TokenTransactionDto(trans).toResponse(true))
    };
  }

  public async findByQuery(query) {
    const data = await this.paymentTokenModel.find(query);
    return data;
  }
}
