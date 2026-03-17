import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { TOKEN_TRANSACTION_SUCCESS_CHANNEL, PURCHASE_ITEM_STATUS, TOKEN_TRANSACTION_PRIVATE_STREAM_SUCCESS_CHANNEL, TOKEN_TRANSACTION_UPDATE_SUCCESS_CHANNEL, UPDATE_TOKEN_TRANSACTION_PRIVATE_STREAM_SUCCESS_CHANNEL } from 'src/modules/token-transaction/constants';
import { EVENT } from 'src/kernel/constants';
import { PerformerService } from 'src/modules/performer/services';
import { SettingService } from 'src/modules/settings';
import { ObjectId } from 'mongodb';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { UserService } from 'src/modules/user/services';
import { PaymentDto } from 'src/modules/payment/dtos';
import * as moment from 'moment';
import { EVENT_TOKEN_TRANSACTION_SUCCESS_CHANNEL, PAYMENT_TYPE, REJECT_EVENT_TOKEN_TRANSACTION_SUCCESS_CHANNEL, TRANSACTION_SUCCESS_CHANNEL } from 'src/modules/payment/constants';
import { ReferralService } from 'src/modules/referral/referral.service';
import { EarningDto } from '../dtos/earning.dto';
import { EARNING_MODEL_PROVIDER, REFERRAL_EARNING_MODEL_PROVIDER, GROUP_EARNING_MODEL_PROVIDER } from '../providers/earning.provider';
import { EarningModel } from '../models/earning.model';
import { SETTING_KEYS } from '../../settings/constants';
import { ReferralEarningModel } from '../models/referral-earning.model';
import { GroupEarningModel } from '../models/group-earning.model';

const EARNING_TOKEN_TOPIC = 'EARNING_TOKEN_TOPIC';
const UPDATE_EARNING_TOKEN_TOPIC = 'UPDATE_EARNING_TOKEN_TOPIC';
const EARNING_TOKEN_EVENT_TOPIC = 'EARNING_TOKEN_EVENT_TOPIC';
const EARNING_PAYOUT_TOKEN_EVENT_TOPIC = 'EARNING_PAYOUT_TOKEN_EVENT_TOPIC';
const EARNING_MONEY_TOPIC = 'EARNING_MONEY_TOPIC';
const EARNING_PRIVATE_STREAM_TOPIC = 'EARNING_PRIVATE_STREAM_TOPIC';
const UPDATE_EARNING_PRIVATE_STREAM_TOPIC = 'UPDATE_EARNING_PRIVATE_STREAM_TOPIC';

@Injectable()
export class TransactionEarningListener {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(EARNING_MODEL_PROVIDER)
    private readonly PerformerEarningModel: Model<EarningModel>,
    private readonly queueEventService: QueueEventService,
    private readonly socketUserService: SocketUserService,
    private readonly referralService: ReferralService,
    @Inject(REFERRAL_EARNING_MODEL_PROVIDER)
    private readonly referralEarningModel: Model<ReferralEarningModel>,
    @Inject(GROUP_EARNING_MODEL_PROVIDER)
    private readonly groupEarningModel: Model<GroupEarningModel>
  ) {
    this.queueEventService.subscribe(
      TOKEN_TRANSACTION_SUCCESS_CHANNEL,
      EARNING_TOKEN_TOPIC,
      this.handleListenEarningToken.bind(this)
    );
    this.queueEventService.subscribe(
      TOKEN_TRANSACTION_UPDATE_SUCCESS_CHANNEL,
      UPDATE_EARNING_TOKEN_TOPIC,
      this.handleListenUpdateEarningToken.bind(this)
    );
    this.queueEventService.subscribe(
      TRANSACTION_SUCCESS_CHANNEL,
      EARNING_MONEY_TOPIC,
      this.handleListenEarningMoney.bind(this)
    );
    this.queueEventService.subscribe(
      EVENT_TOKEN_TRANSACTION_SUCCESS_CHANNEL,
      EARNING_TOKEN_EVENT_TOPIC,
      this.handleListenEarningTokenEvent.bind(this)
    );
    this.queueEventService.subscribe(
      REJECT_EVENT_TOKEN_TRANSACTION_SUCCESS_CHANNEL,
      EARNING_PAYOUT_TOKEN_EVENT_TOPIC,
      this.handleListenEarningPayoutTokenEvent.bind(this)
    );
    this.queueEventService.subscribe(
      TOKEN_TRANSACTION_PRIVATE_STREAM_SUCCESS_CHANNEL,
      EARNING_PRIVATE_STREAM_TOPIC,
      this.handleListenEarningPrivateStreamToken.bind(this)
    );
    this.queueEventService.subscribe(
      UPDATE_TOKEN_TRANSACTION_PRIVATE_STREAM_SUCCESS_CHANNEL,
      UPDATE_EARNING_PRIVATE_STREAM_TOPIC,
      this.handleListenUpdateEarningPrivateStreamToken.bind(this)
    );
  }

  // user purchases something of model
  public async handleListenEarningToken(
    event: QueueEvent
  ): Promise<EarningDto> {
    if (event.eventName !== EVENT.CREATED) {
      return;
    }
    const transaction = event.data;
    if (!transaction || transaction.status !== PURCHASE_ITEM_STATUS.SUCCESS || !transaction.totalPrice) {
      return;
    }
    const [
      settingCommission, performer, subCommission
    ] = await Promise.all([
      SettingService.getValueByKey(SETTING_KEYS.PERFORMER_COMMISSION),
      this.performerService.findById(transaction.performerId),
      SettingService.getValueByKey(SETTING_KEYS.ACCOUNT_MANAGER_COMMISSION)
    ]);
    let sub = 0;
    const commission = performer.commissionPercentage || settingCommission;
    if (performer.accountManager === 'self-managed') {
      sub = 0;
    } else if (performer.accountManager === 'stunnerZ-managed') {
      sub = subCommission;
    } else if (transaction?.subPerformerId) {
      sub = transaction.commissionPrivilege
        ? transaction.commissionPrivilege / 100
        : performer.commissionExternalAgency
          ? performer.commissionExternalAgency / 100
          : 0;
    } else {
      sub = 0;
    }

    const transactionCost = transaction?.transactionCost || 0;
    const grossPrice = transaction.totalPrice - transactionCost;
    
    const netPrice = (grossPrice * (1 - commission)) * (1 - sub); // 100 * 0,1 = 90 * 0.1 = 81
    const subPrice = (grossPrice * (1 - commission)) - netPrice; // 90 - 81 = 9

    const newEarning = new this.PerformerEarningModel();
    newEarning.set('siteCommission', commission);
    newEarning.set('subPerformerCommission', sub);
    newEarning.set('siteTransactionCost', transactionCost);
    newEarning.set('totalPrice', transaction.totalPrice);
    newEarning.set('grossPrice', grossPrice);
    newEarning.set('netPrice', netPrice);
    newEarning.set('subPerformerPrice', subPrice);
    newEarning.set('performerId', transaction.performerId);
    newEarning.set('userId', transaction.sourceId);
    newEarning.set('subPerformerId', transaction?.subPerformerId);
    newEarning.set('transactionId', transaction._id);
    newEarning.set('sourceType', transaction.target);
    newEarning.set('type', transaction.type);
    newEarning.set('createdAt', transaction.createdAt);
    newEarning.set('isPaid', false);
    newEarning.set('paymentGateway', 'system');
    newEarning.set('isToken', true);
    await newEarning.save();
    // update balance
    await this.updateBalance(newEarning.grossPrice, netPrice, newEarning, subPrice);
    await this.notifyPerformerBalance(newEarning, netPrice);

    // create group earning by original earning
    this.createGroupEarning(newEarning, newEarning.performerId, newEarning.type);

    // create referral earning
    this.createPerformerReferralEarning(newEarning);
    if (transaction && transaction.subPerformerId) {
      this.createSubPerformerReferralEarning(newEarning);
    }
    this.createUserReferralEarning(newEarning);
  }
  // user purchases something of model
  public async handleListenUpdateEarningToken(
    event: QueueEvent
  ): Promise<EarningDto> {
    if (event.eventName !== EVENT.UPDATED) {
      return;
    }
    const transaction = event.data;
    if (!transaction || transaction.status !== PURCHASE_ITEM_STATUS.SUCCESS || !transaction.totalPrice) {
      return;
    }
    const [
      settingCommission, performer, subCommission
    ] = await Promise.all([
      SettingService.getValueByKey(SETTING_KEYS.PERFORMER_COMMISSION),
      this.performerService.findById(transaction.performerId),
      SettingService.getValueByKey(SETTING_KEYS.ACCOUNT_MANAGER_COMMISSION)
    ]);
    let sub = 0;
    const commission = performer.commissionPercentage || settingCommission;
    if (performer.accountManager === 'self-managed') {
      sub = 0;
    } else if (performer.accountManager === 'stunnerZ-managed') {
      sub = subCommission;
    } else if (transaction?.subPerformerId) {
      sub = transaction.commissionPrivilege
        ? transaction.commissionPrivilege / 100
        : performer.commissionExternalAgency
          ? performer.commissionExternalAgency / 100
          : 0;
    } else {
      sub = 0;
    }

    const transactionCost = transaction?.transactionCost || 0;
    const grossPrice = transaction.totalPrice - transactionCost;
    
    const netPrice = (grossPrice * (1 - commission)) * (1 - sub); // 100 * 0,1 = 90 * 0.1 = 81
    const subPrice = (grossPrice * (1 - commission)) - netPrice; // 90 - 81 = 9

    let tokenSub = subPrice;
    if (transaction.type = 'public_chat') {
      const findEarning = await this.PerformerEarningModel.findOne({ transactionId: transaction._id });
      if (findEarning) {
        tokenSub = Number(subPrice) - Number(findEarning?.subPerformerPrice);
      }
    }

    const filter = { transactionId: transaction._id };
    const update = {
      siteCommission: commission,
      subPerformerCommission: sub,
      siteTransactionCost: transactionCost,
      totalPrice: transaction.totalPrice,
      grossPrice: grossPrice,
      netPrice: netPrice,
      subPerformerPrice: subPrice,
      performerId: transaction.performerId,
      userId: transaction.sourceId,
      subPerformerId: transaction?.subPerformerId,
      transactionId: transaction._id,
      sourceType: transaction.target,
      type: transaction.type,
      createdAt: transaction.createdAt,
      isPaid: false,
      paymentGateway: 'system',
      isToken: true,
      updatedAt: new Date(),
    };
    
    const options = { new: true, upsert: true };
    
    const newEarning = await this.PerformerEarningModel.findOneAndUpdate(filter, update, options);
    // update balance
    await this.updateBalance(newEarning.grossPrice, netPrice, newEarning, tokenSub);
    await this.notifyPerformerBalance(newEarning, netPrice);
    await this.notifyUpdateBalance(transaction.sourceId, transaction.performerId, transaction?.targetId);

    // create group earning by original earning
    this.updateGroupEarning(newEarning, newEarning.performerId, newEarning.type);

    // create referral earning
    this.createPerformerReferralEarning(newEarning, true);
    if (transaction && transaction.subPerformerId) {
      this.createSubPerformerReferralEarning(newEarning, true);
    }
    this.createUserReferralEarning(newEarning, true);
  }

  // user purchases something of model
  public async handleListenEarningPrivateStreamToken(
    event: QueueEvent
  ): Promise<EarningDto> {
    if (event.eventName !== EVENT.CREATED) {
      return;
    }
    const transaction = event.data;
    if (!transaction || transaction.status !== PURCHASE_ITEM_STATUS.SUCCESS || !transaction.totalPrice) {
      return;
    }
    const [
      settingCommission, performer, subCommission
    ] = await Promise.all([
      SettingService.getValueByKey(SETTING_KEYS.PERFORMER_COMMISSION),
      this.performerService.findById(transaction.performerId),
      SettingService.getValueByKey(SETTING_KEYS.ACCOUNT_MANAGER_COMMISSION)
    ]);
    let sub = 0;
    const commission = performer.commissionPercentage || settingCommission;
    if (performer.accountManager === 'self-managed') {
      sub = 0;
    } else if (performer.accountManager === 'stunnerZ-managed') {
      sub = subCommission;
    } else if (transaction?.subPerformerId) {
      sub = transaction.commissionPrivilege
        ? transaction.commissionPrivilege / 100
        : performer.commissionExternalAgency
          ? performer.commissionExternalAgency / 100
          : 0;
    } else {
      sub = 0;
    }

    const transactionCost = transaction?.transactionCost || 0;
    const grossPrice = transaction.totalPrice - transactionCost;
    
    const netPrice = (grossPrice * (1 - commission)) * (1 - sub); // 100 * 0,1 = 90 * 0.1 = 81
    const subPrice = (grossPrice * (1 - commission)) - netPrice; // 90 - 81 = 9

    const newEarning = new this.PerformerEarningModel();
    newEarning.set('siteCommission', commission);
    newEarning.set('subPerformerCommission', sub);
    newEarning.set('siteTransactionCost', transactionCost);
    newEarning.set('totalPrice', transaction.totalPrice);
    newEarning.set('grossPrice', grossPrice);
    newEarning.set('netPrice', netPrice);
    newEarning.set('subPerformerPrice', subPrice);
    newEarning.set('performerId', transaction.performerId);
    newEarning.set('userId', transaction.sourceId);
    newEarning.set('subPerformerId', transaction?.subPerformerId);
    newEarning.set('transactionId', transaction._id);
    newEarning.set('sourceType', transaction.target);
    newEarning.set('type', transaction.type);
    newEarning.set('createdAt', transaction.createdAt);
    newEarning.set('isPaid', false);
    newEarning.set('paymentGateway', 'system');
    newEarning.set('isToken', true);
    await newEarning.save();
    // update balance
    await this.updateBalance(newEarning.grossPrice, netPrice, newEarning, subPrice);
    await this.notifyPerformerBalance(newEarning, netPrice);

    // create group earning by original earning
    this.createGroupEarning(newEarning, newEarning.performerId, newEarning.type);

    // create referral earning
    this.createPerformerReferralEarning(newEarning);
    this.createUserReferralEarning(newEarning);
  }

  // user purchases something of model
  public async handleListenUpdateEarningPrivateStreamToken(
    event: QueueEvent
  ): Promise<EarningDto> {
    if (event.eventName !== EVENT.UPDATED) {
      return;
    }
    const transaction = event.data;
    if (!transaction || transaction.status !== PURCHASE_ITEM_STATUS.SUCCESS || !transaction.totalPrice) {
      return;
    }
    const [
      settingCommission, performer, subCommission
    ] = await Promise.all([
      SettingService.getValueByKey(SETTING_KEYS.PERFORMER_COMMISSION),
      this.performerService.findById(transaction.performerId),
      SettingService.getValueByKey(SETTING_KEYS.ACCOUNT_MANAGER_COMMISSION)
    ]);
    let sub = 0;
    const commission = performer.commissionPercentage || settingCommission;
    if (performer.accountManager === 'self-managed') {
      sub = 0;
    } else if (performer.accountManager === 'stunnerZ-managed') {
      sub = subCommission;
    } else if (transaction?.subPerformerId) {
      sub = transaction.commissionPrivilege
        ? transaction.commissionPrivilege / 100
        : performer.commissionExternalAgency
          ? performer.commissionExternalAgency / 100
          : 0;
    } else {
      sub = 0;
    }

    const transactionCost = transaction?.transactionCost || 0;
    const grossPrice = transaction.totalPrice - transactionCost;
    
    const netPrice = (grossPrice * (1 - commission)) * (1 - sub); // 100 * 0,1 = 90 * 0.1 = 81
    const subPrice = (grossPrice * (1 - commission)) - netPrice; // 90 - 81 = 9
    const findEarning = await this.PerformerEarningModel.findOne({ transactionId: transaction._id });
    let tokenSub = 0;
    if (findEarning) {
      tokenSub = Number(subPrice) - Number(findEarning?.subPerformerPrice);
    }
    const filter = { transactionId: transaction._id };
    const update = {
      siteCommission: commission,
      subPerformerCommission: sub,
      siteTransactionCost: transactionCost,
      totalPrice: transaction.totalPrice,
      grossPrice: grossPrice,
      netPrice: netPrice,
      subPerformerPrice: subPrice,
      performerId: transaction.performerId,
      userId: transaction.sourceId,
      subPerformerId: transaction?.subPerformerId,
      transactionId: transaction._id,
      sourceType: transaction.target,
      type: transaction.type,
      createdAt: transaction.createdAt,
      isPaid: false,
      paymentGateway: 'system',
      isToken: true,
      updatedAt: new Date(),
    };
    
    const options = { new: true, upsert: true };
    const newEarning = await this.PerformerEarningModel.findOneAndUpdate(filter, update, options);

    // update balance
    await this.updateBalance(newEarning.grossPrice, netPrice, newEarning, tokenSub);
    await this.notifyPerformerBalance(newEarning, netPrice);

    // create group earning by original earning
    this.updateGroupEarning(newEarning, newEarning.performerId, newEarning.type);

    // create referral earning
    this.createPerformerReferralEarning(newEarning, true);
    this.createUserReferralEarning(newEarning, true);
  }

  // admin purchase to admin
  public async handleListenEarningTokenEvent(
    event: QueueEvent
  ): Promise<EarningDto> {
    if (event.eventName !== EVENT.CREATED) {
      return;
    }
    const transaction = event.data;
    if (!transaction || transaction.status !== PURCHASE_ITEM_STATUS.SUCCESS || !transaction.totalPrice) {
      return;
    }

    const [
      eventCommission
    ] = await Promise.all([
      SettingService.getValueByKey(SETTING_KEYS.EVENT_COMMISSION)
    ]);

    const transactionCost = transaction?.transactionCost || 0;
    const grossPrice = transaction.totalPrice - transactionCost;
    const netPrice = (transaction.totalPrice - transactionCost) * (1 - eventCommission);

    const newEarning = new this.PerformerEarningModel();
    newEarning.set('siteCommission', eventCommission);
    newEarning.set('subPerformerCommission', null);
    newEarning.set('siteTransactionCost', transactionCost);
    newEarning.set('totalPrice', transaction.totalPrice);
    newEarning.set('grossPrice', grossPrice);
    newEarning.set('netPrice', -netPrice);
    newEarning.set('subPerformerPrice', 0);
    newEarning.set('performerId', transaction.performerId);
    newEarning.set('userId', transaction.sourceId);
    newEarning.set('subPerformerId', null);
    newEarning.set('transactionId', transaction._id);
    newEarning.set('sourceType', transaction.target);
    newEarning.set('type', transaction.type);
    newEarning.set('createdAt', transaction.createdAt);
    newEarning.set('isPaid', false);
    newEarning.set('paymentGateway', 'system');
    newEarning.set('isToken', true);
    await newEarning.save();
    // update balance
    await this.updateBalanceBuyEvent(-netPrice, newEarning);
    await this.notifyPerformerBalance(newEarning, -netPrice);

    // create group earning by original earning
    this.createGroupEarning(newEarning, newEarning.performerId, newEarning.type);

    // create referral earning
    this.createPerformerReferralEarning(newEarning);
    this.createUserReferralEarning(newEarning);
  }

  // admin payout to performer
  public async handleListenEarningPayoutTokenEvent(
    event: QueueEvent
  ): Promise<EarningDto> {
    if (event.eventName !== EVENT.CREATED) {
      return;
    }
    const transaction = event.data;
    if (!transaction || transaction.status !== PURCHASE_ITEM_STATUS.SUCCESS || !transaction.totalPrice) {
      return;
    }

    const [
      eventCommission
    ] = await Promise.all([
      SettingService.getValueByKey(SETTING_KEYS.EVENT_COMMISSION)
    ]);

    const transactionCost = transaction?.transactionCost || 0;
    const grossPrice = transaction.totalPrice - transactionCost;
    const netPrice = (transaction.totalPrice - transactionCost) * (1 - eventCommission);

    const newEarning = new this.PerformerEarningModel();
    newEarning.set('siteCommission', eventCommission);
    newEarning.set('subPerformerCommission', null);
    newEarning.set('siteTransactionCost', transactionCost);
    newEarning.set('totalPrice', transaction.totalPrice);
    newEarning.set('grossPrice', grossPrice);
    newEarning.set('netPrice', netPrice);
    newEarning.set('subPerformerPrice', 0);
    newEarning.set('performerId', transaction.performerId);
    newEarning.set('userId', transaction.sourceId);
    newEarning.set('subPerformerId', null);
    newEarning.set('transactionId', transaction._id);
    newEarning.set('sourceType', transaction.target);
    newEarning.set('type', transaction.type);
    newEarning.set('createdAt', transaction.createdAt);
    newEarning.set('isPaid', false);
    newEarning.set('paymentGateway', 'system');
    newEarning.set('isToken', true);
    await newEarning.save();
    // update balance
    await this.updateBalanceBuyEvent(transaction.totalPrice, newEarning);
    await this.notifyPerformerBalance(newEarning, transaction.totalPrice);

    // create group earning by original earning
    this.createGroupEarning(newEarning, newEarning.performerId, newEarning.type);

    // create referral earning
    this.createPerformerReferralEarning(newEarning);
    this.createUserReferralEarning(newEarning);
  }

  // user subscribes a model
  public async handleListenEarningMoney(
    event: QueueEvent
  ): Promise<EarningDto> {
    if (event.eventName !== EVENT.CREATED) {
      return;
    }
    const transaction = event.data as any;
    if (!transaction || transaction.status !== PURCHASE_ITEM_STATUS.SUCCESS || !transaction.totalPrice) {
      return;
    }
    if (![
      PAYMENT_TYPE.TRIAL_SUBSCRIPTION,
      PAYMENT_TYPE.MONTHLY_SUBSCRIPTION,
      PAYMENT_TYPE.SIX_MONTH_SUBSCRIPTION,
      PAYMENT_TYPE.ONE_TIME_SUBSCRIPTION
    ].includes(transaction.type)) {
      return;
    }
    const [
      settingCommission, performer, subCommission
    ] = await Promise.all([
      SettingService.getValueByKey(SETTING_KEYS.PERFORMER_COMMISSION),
      this.performerService.findById(transaction.performerId),
      SettingService.getValueByKey(SETTING_KEYS.ACCOUNT_MANAGER_COMMISSION)
    ]);
    let sub = 0;
    const commission = performer.commissionPercentage || settingCommission;
    if (performer.accountManager === 'self-managed') {
      sub = 0;
    } else if (performer.accountManager === 'stunnerZ-managed') {
      sub = subCommission;
    } else if (transaction?.subPerformerId) {
      sub = transaction.commissionPrivilege
        ? transaction.commissionPrivilege / 100
        : performer.commissionExternalAgency
          ? performer.commissionExternalAgency / 100
          : 0;
    } else {
      sub = 0;
    }
    const transactionCost = transaction?.transactionCost || 0;
    const grossPrice = transaction.totalPrice - transactionCost;
    
    const netPrice = (grossPrice * (1 - commission)) * (1 - sub); // 100 * 0,1 = 90 * 0.1 = 81
    const subPrice = (grossPrice * (1 - commission)) - netPrice; // 90 - 81 = 9

    const newEarning = new this.PerformerEarningModel();
    newEarning.set('siteCommission', commission);
    newEarning.set('subPerformerCommission', sub);
    newEarning.set('transactionCost', transactionCost);
    newEarning.set('totalPrice', transaction.totalPrice);
    newEarning.set('grossPrice', grossPrice);
    newEarning.set('netPrice', netPrice);
    newEarning.set('subPerformerPrice', subPrice);
    newEarning.set('performerId', transaction.performerId);
    newEarning.set('userId', transaction.sourceId);
    newEarning.set('subPerformerId', transaction?.subPerformerId);
    newEarning.set('transactionId', transaction._id);
    newEarning.set('sourceType', transaction.target);
    newEarning.set('type', transaction.type);
    newEarning.set('createdAt', transaction.createdAt);
    newEarning.set('updatedAt', transaction.updatedAt);
    newEarning.set('paymentGateway', transaction.paymentGateway);
    newEarning.set('isPaid', false);
    newEarning.set('isToken', false);
    await newEarning.save();

    // create group earning by original earning
    this.createGroupEarning(newEarning, newEarning.performerId, newEarning.type);

    // update balance
    await this.updateBalance(newEarning.grossPrice, netPrice, newEarning, subPrice);
    await this.notifyPerformerBalance(newEarning, netPrice);

    // create referral earning
    this.createPerformerReferralEarning(newEarning);
    if (transaction && transaction.subPerformerId) {
      this.createSubPerformerReferralEarning(newEarning);
    }
    this.createUserReferralEarning(newEarning);
  }

  private async updateBalanceBuyEvent(performerTokens, earning) {
    await Promise.all([
      this.performerService.updatePerformerBalance(earning.performerId, performerTokens)
    ]);
  }

  private async updateBalance(userTokens, performerTokens, earning, subTokens) {
    await Promise.all([
      this.performerService.updatePerformerBalance(earning.performerId, performerTokens),
      earning.isToken && this.userService.updateBalance(
        earning.userId,
        -userTokens
      ),
      earning.isToken && earning.subPerformerId && this.userService.updateBalance(
        earning.subPerformerId,
        subTokens
      )
    ]);
  }

  private async notifyPerformerBalance(earning, performerTokens) {
    await this.socketUserService.emitToUsers(earning.performerId.toString(), 'update_balance', {
      token: performerTokens
    });
  }

  private async notifyUserBalance(userId: ObjectId, token: number) {
    await this.socketUserService.emitToUsers(userId, 'update_balance', {
      token
    });
  }

  private async notifyUpdateBalance(userId: ObjectId, performerId: ObjectId, streamId: string) {
    await this.socketUserService.emitToUsers(userId, 'update_balance_stream', {
      streamId
    });
    await this.socketUserService.emitToUsers(performerId, 'update_balance_stream', {
      streamId
    });
  }

  // create referral earning for Presenter, when performer receives balance
  private async createPerformerReferralEarning(earning: EarningModel, update?: boolean) {
    // this is performer
    const [referralPerformer] = await Promise.all([
      this.referralService.findOne({
        registerId: earning.performerId
      })
    ]);

    // if the Presenter is another performer -> commission performer refer performer (p2p)
    // if the Presenter is fan -> commission fan refer performer (f2p)
    if (referralPerformer) {
      // earns for 6m
      if (moment().isBefore(moment(referralPerformer.createdAt).subtract(6, 'month'))) return;
      const referralCommission = SettingService.getValueByKey(
        referralPerformer.referralSource === 'performer'
          ? SETTING_KEYS.PERFORMER_TO_PERFORMER_REFERRAL_COMMISSION// model ref model
          : SETTING_KEYS.PERFORMER_TO_USER_REFERRAL_COMMISSION // model ref user
      ) || 0.05;
      let referralEarning;
      if (update) {
        referralEarning = await this.referralEarningModel.updateOne({ _id: earning._id }, {
          registerSource: referralPerformer.registerSource,
          registerId: earning.performerId,
          referralSource: referralPerformer.referralSource,
          referralId: referralPerformer.referralId,
          subPerformerId: earning.subPerformerId ? earning.subPerformerId : null,
          earningId: earning._id,
          type: earning.type,
          grossPrice: earning.netPrice,
          netPrice: earning.netPrice * referralCommission,
          subPerformerPrice: earning.subPerformerPrice * referralCommission,
          referralCommission,
          subPerformerCommission: earning.subPerformerCommission ? earning.subPerformerCommission : 0,
          isPaid: false,
          paidAt: null,
          updatedAt: new Date(),
          isToken: earning.isToken
          // transactionStatus: earning.transactionStatus
        });
      } else {
        referralEarning = await this.referralEarningModel.create({
          registerSource: referralPerformer.registerSource,
          registerId: earning.performerId,
          referralSource: referralPerformer.referralSource,
          referralId: referralPerformer.referralId,
          subPerformerId: earning.subPerformerId ? earning.subPerformerId : null,
          earningId: earning._id,
          type: earning.type,
          grossPrice: earning.netPrice,
          netPrice: earning.netPrice * referralCommission,
          subPerformerPrice: earning.subPerformerPrice * referralCommission,
          referralCommission,
          subPerformerCommission: earning.subPerformerCommission ? earning.subPerformerCommission : 0,
          isPaid: false,
          paidAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isToken: earning.isToken
          // transactionStatus: earning.transactionStatus
        });
      }

      // update referral balance
      referralEarning.referralSource === 'performer' && await this.performerService.updatePerformerBalance(referralEarning.referralId, referralEarning.netPrice);
      referralEarning.referralSource === 'performer' && referralEarning.subPerformerId && await this.userService.updateBalance(referralEarning.subPerformerId, referralEarning.subPerformerPrice);
      referralEarning.referralSource === 'user' && await this.userService.updateBalance(referralEarning.referralId, referralEarning.netPrice);
      this.notifyUserBalance(referralEarning.referralId, referralEarning.netPrice);

      // create group earning by referral earning
      referralPerformer.referralSource === 'performer' && this.createGroupEarning(referralEarning, referralPerformer.referralId, 'referral');
    }
  }

  // create referral earning for Presenter, when performer receives balance
  private async createSubPerformerReferralEarning(earning: EarningModel, update?: boolean) {
    // this is performer
    const [referralPerformer] = await Promise.all([
      this.referralService.findOne({
        registerId: earning.subPerformerId
      })
    ]);

    // if the Presenter is another performer -> commission performer refer performer (p2p)
    // if the Presenter is fan -> commission fan refer performer (f2p)
    if (referralPerformer) {
      // earns for 6m
      if (moment().isBefore(moment(referralPerformer.createdAt).subtract(6, 'month'))) return;
      const referralCommission = SettingService.getValueByKey(
        referralPerformer.referralSource === 'performer'
          ? SETTING_KEYS.PERFORMER_TO_PERFORMER_REFERRAL_COMMISSION// model ref model
          : SETTING_KEYS.PERFORMER_TO_USER_REFERRAL_COMMISSION // model ref user
      ) || 0.05;
      let referralEarning;
      if (update) {
        referralEarning = await this.referralEarningModel.updateOne({ _id: earning._id },{
          registerSource: referralPerformer.registerSource,
          registerId: earning.subPerformerId,
          referralSource: referralPerformer.referralSource,
          referralId: referralPerformer.referralId,
          subPerformerId: earning.subPerformerId ? earning.subPerformerId : null,
          earningId: earning._id,
          type: earning.type,
          grossPrice: earning.netPrice,
          netPrice: earning.netPrice * referralCommission,
          subPerformerPrice: earning.subPerformerPrice * referralCommission,
          referralCommission,
          subPerformerCommission: earning.subPerformerCommission ? earning.subPerformerCommission : 0,
          isPaid: false,
          paidAt: null,
          updatedAt: new Date(),
          isToken: earning.isToken
          // transactionStatus: earning.transactionStatus
        });
      } else {
        referralEarning = await this.referralEarningModel.create({
          registerSource: referralPerformer.registerSource,
          registerId: earning.subPerformerId,
          referralSource: referralPerformer.referralSource,
          referralId: referralPerformer.referralId,
          subPerformerId: earning.subPerformerId ? earning.subPerformerId : null,
          earningId: earning._id,
          type: earning.type,
          grossPrice: earning.netPrice,
          netPrice: earning.netPrice * referralCommission,
          subPerformerPrice: earning.subPerformerPrice * referralCommission,
          referralCommission,
          subPerformerCommission: earning.subPerformerCommission ? earning.subPerformerCommission : 0,
          isPaid: false,
          paidAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isToken: earning.isToken
          // transactionStatus: earning.transactionStatus
        });
      }

      // update referral balance
      referralEarning.referralSource === 'performer' && await this.performerService.updatePerformerBalance(referralEarning.referralId, referralEarning.netPrice);
      referralEarning.referralSource === 'performer' && referralEarning.subPerformerId && await this.userService.updateBalance(referralEarning.subPerformerId, referralEarning.subPerformerPrice);
      referralEarning.referralSource === 'user' && await this.userService.updateBalance(referralEarning.referralId, referralEarning.netPrice);
      this.notifyUserBalance(referralEarning.referralId, referralEarning.netPrice);

      // create group earning by referral earning
      referralPerformer.referralSource === 'performer' && this.createGroupEarning(referralEarning, referralPerformer.referralId, 'referral');
    }
  }

  // create referral earning for user role, when user uses wallet balance
  private async createUserReferralEarning(earning: EarningModel, update?: boolean) {
    // This is Fan
    const [referralUser] = await Promise.all([
      this.referralService.findOne({
        registerId: earning.userId
      })
    ]);

    // create earning for referrer if the user have referrer
    // referral source
    // if the Presenter is a model -> commission performer refer fan (p2f)
    // if the Presenter is another fan -> commission fan refer fan (f2f)
    if (referralUser) {
      const referralCommission = SettingService.getValueByKey(
        referralUser.referralSource === 'performer'
          ? SETTING_KEYS.USER_TO_PERFORMER_REFERRAL_COMMISSION // fan ref model
          : SETTING_KEYS.USER_TO_USER_REFERRAL_COMMISSION // fan ref fan
      ) || 0.01;
      let referralEarning;
      if (update) {
        referralEarning = await this.referralEarningModel.updateOne({ _id: earning._id }, {
          registerSource: referralUser.registerSource,
          registerId: earning.userId,
          referralSource: referralUser.referralSource,
          referralId: referralUser.referralId,
          subPerformerId: earning.subPerformerId ? earning.subPerformerId : null,
          earningId: earning._id,
          type: earning.type,
          grossPrice: earning.grossPrice,
          netPrice: earning.grossPrice * referralCommission,
          subPerformerPrice: earning.subPerformerPrice * referralCommission,
          referralCommission,
          isPaid: false,
          subPerformerCommission: earning.subPerformerCommission ? earning.subPerformerCommission : 0,
          paidAt: null,
          updatedAt: new Date(),
          isToken: earning.isToken
          // transactionStatus: earning.transactionStatus
        });
      } else {
        referralEarning = await this.referralEarningModel.create({
          registerSource: referralUser.registerSource,
          registerId: earning.userId,
          referralSource: referralUser.referralSource,
          referralId: referralUser.referralId,
          subPerformerId: earning.subPerformerId ? earning.subPerformerId : null,
          earningId: earning._id,
          type: earning.type,
          grossPrice: earning.grossPrice,
          netPrice: earning.grossPrice * referralCommission,
          subPerformerPrice: earning.subPerformerPrice * referralCommission,
          referralCommission,
          isPaid: false,
          subPerformerCommission: earning.subPerformerCommission ? earning.subPerformerCommission : 0,
          paidAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isToken: earning.isToken
          // transactionStatus: earning.transactionStatus
        });
      }

      // apply with earning is token (user uses token in wallet) or Subscription (USD)
      // update referral earning to wallet
      referralEarning.referralSource === 'performer' && await this.performerService.updatePerformerBalance(referralEarning.referralId, referralEarning.netPrice);
      referralEarning.referralSource === 'performer' && referralEarning.subPerformerId && await this.userService.updateBalance(referralEarning.subPerformerId, referralEarning.subPerformerPrice);
      referralEarning.referralSource === 'user' && await this.userService.updateBalance(referralEarning.referralId, referralEarning.netPrice);
      this.notifyUserBalance(referralEarning.referralId, referralEarning.netPrice);

      // create group earning by referral earning
      referralUser.referralSource === 'performer' && this.createGroupEarning(referralEarning, referralUser.referralId, 'referral');
    }
  }

  // create referral earning for user role, when user uses wallet balance
  private async createGroupEarning(earning: any, performerId, sourceType) {
    await this.groupEarningModel.create({
      sourceId: earning._id,
      sourceType,
      performerId,
      subPerformerId: earning?.subPerformerId,
      isPaid: false,
      createdAt: new Date()
    });
  }

  // update referral earning for user role, when user uses wallet balance
  private async updateGroupEarning(earning: any, performerId, sourceType) {
    await this.groupEarningModel.updateOne({ _id: earning?._id }, {
      sourceId: earning._id,
      sourceType,
      performerId,
      subPerformerId: earning?.subPerformerId,
      isPaid: false,
      updatedAt: new Date()
    });
  }
}
