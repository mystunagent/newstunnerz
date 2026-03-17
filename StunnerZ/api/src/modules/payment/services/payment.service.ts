/* eslint-disable no-nested-ternary */
import {
  Injectable, Inject, forwardRef, HttpException, ForbiddenException
} from '@nestjs/common';
import { CouponDto } from 'src/modules/coupon/dtos';
import {
  EntityNotFoundException,
  QueueEventService,
  QueueEvent
} from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { CouponService } from 'src/modules/coupon/services';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { PerformerDto } from 'src/modules/performer/dtos';
import { PerformerService } from 'src/modules/performer/services';
// import { SubscriptionModel } from 'src/modules/subscription/models/subscription.model';
import { SUBSCRIPTION_STATUS, SUBSCRIPTION_TYPE } from 'src/modules/subscription/constants';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
// import axios from 'axios';
import { UserDto } from 'src/modules/user/dtos';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { SubPerformerService, UserService } from 'src/modules/user/services';
// import { isObjectId } from 'src/kernel/helpers/string.helper';
import { ACCOUNT_MANAGER } from 'src/modules/performer/constants';
import { ROLE_SUB_PERFORMER, SET_EARNING_AGENCY } from 'src/modules/user/constants';
import { PAYMENT_TRANSACTION_MODEL_PROVIDER } from '../providers';
import { PaymentTransactionModel } from '../models';
import {
  PurchaseTokenPayload, SubscribePerformerPayload
} from '../payloads';
import {
  PAYMENT_STATUS,
  PAYMENT_TYPE,
  PAYMENT_TARGET_TYPE,
  TRANSACTION_SUCCESS_CHANNEL
} from '../constants';
import {
  MissingConfigPaymentException
} from '../exceptions';
import { VerotelService } from '../services';
import { PaymentDto } from '../dtos';

// const ccbillCancelUrl = 'https://datalink.ccbill.com/utils/subscriptionManagement.cgi';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => CouponService))
    private readonly couponService: CouponService,
    @Inject(forwardRef(() => VerotelService))
    private readonly verotelService: VerotelService,
    @Inject(forwardRef(() => SubPerformerService))
    private readonly subPerformerService: SubPerformerService,
    @Inject(PAYMENT_TRANSACTION_MODEL_PROVIDER)
    private readonly TransactionModel: Model<PaymentTransactionModel>,
    private readonly queueEventService: QueueEventService,
    private readonly settingService: SettingService,
    private readonly socketUserService: SocketUserService
  ) {
  }

  public async findById(id: string | ObjectId) {
    const data = await this.TransactionModel.findById(id);
    return data;
  }

  // todo - remove
  // private async getCCbillPaymentGatewaySettings() {
  //   const flexformId = SettingService.getValueByKey(SETTING_KEYS.CCBILL_FLEXFORM_ID);
  //   const singleSubAccountNumber = SettingService.getValueByKey(SETTING_KEYS.CCBILL_SINGLE_SUB_ACCOUNT_NUMBER);
  //   const recurringSubAccountNumber = SettingService.getValueByKey(SETTING_KEYS.CCBILL_RECURRING_SUB_ACCOUNT_NUMBER);
  //   const salt = SettingService.getValueByKey(SETTING_KEYS.CCBILL_SALT);
  //   if (!flexformId || !singleSubAccountNumber || !recurringSubAccountNumber || !salt) {
  //     throw new MissingConfigPaymentException();
  //   }
  //   return {
  //     flexformId,
  //     singleSubAccountNumber,
  //     recurringSubAccountNumber,
  //     salt
  //   };
  // }

  public async createSubscriptionPaymentTransaction(
    performer: PerformerDto,
    subscriptionType: string,
    user: UserDto,
    paymentGateway = 'verotel',
    couponInfo?: CouponDto
  ) {
    const price = () => {
      switch (subscriptionType) {
        case PAYMENT_TYPE.TRIAL_SUBSCRIPTION: return performer.trialPrice;
        case PAYMENT_TYPE.MONTHLY_SUBSCRIPTION: return performer.monthlyPrice;
        case PAYMENT_TYPE.SIX_MONTH_SUBSCRIPTION: return performer.sixMonthPrice;
        case PAYMENT_TYPE.ONE_TIME_SUBSCRIPTION: return performer.oneTimePrice;
        default: return performer.monthlyPrice;
      }
    };
    const transactionCostPercent = await this.settingService.getKeyValue(SETTING_KEYS.TRANSACTION_COST);
    const transactionCost = Number((price() * (transactionCostPercent || 0.04)).toFixed(2));

    const totalPrice = couponInfo
      ? (price() + transactionCost) - parseFloat(((price() + transactionCost) * couponInfo.value).toFixed(2))
      : (price() + transactionCost);
    const prodDescription = `
      ${subscriptionType.split('_').join(' ')} ${performer?.name || performer?.username}
      ${subscriptionType === PAYMENT_TYPE.TRIAL_SUBSCRIPTION && `in ${performer?.durationTrialSubscriptionDays} days`}
    `;
    return this.TransactionModel.create({
      paymentGateway,
      source: 'user',
      sourceId: user._id,
      target: PAYMENT_TARGET_TYPE.PERFORMER,
      targetId: performer._id,
      performerId: performer._id,
      type: subscriptionType,
      originalPrice: price(),
      totalPrice,
      transactionCost,
      products: [
        {
          price: totalPrice,
          quantity: 1,
          name: `${subscriptionType.split('_').join(' ')} ${performer?.name || performer?.username}`,
          description: prodDescription,
          productId: performer._id,
          productType: PAYMENT_TARGET_TYPE.PERFORMER,
          performerId: performer._id
        }
      ],
      couponInfo,
      status: PAYMENT_STATUS.CREATED,
      paymentResponseInfo: null
    });
  }

  // todo - remove
  // public async createCCbillRenewalSubscriptionPaymentTransaction(subscription: SubscriptionModel, payload: any) {
  //   const price = payload.billedAmount || payload.accountingAmount;
  //   const { userId, performerId, subscriptionType } = subscription;
  //   const performer = await this.performerService.findById(performerId);
  //   const subType = subscriptionType === SUBSCRIPTION_TYPE.SIX_MONTH
  //     ? PAYMENT_TYPE.SIX_MONTH_SUBSCRIPTION
  //     : subscriptionType === SUBSCRIPTION_TYPE.ONE_TIME
  //       ? PAYMENT_TYPE.ONE_TIME_SUBSCRIPTION
  //       : PAYMENT_TYPE.MONTHLY_SUBSCRIPTION;
  //   if (!performer) return null;
  //   return this.TransactionModel.create({
  //     paymentGateway: 'ccbill',
  //     source: 'user',
  //     sourceId: userId,
  //     target: PAYMENT_TARGET_TYPE.PERFORMER,
  //     targetId: performerId,
  //     performerId,
  //     type: subType,
  //     originalPrice: price,
  //     totalPrice: price,
  //     products: [{
  //       price,
  //       quantity: 1,
  //       name: `${subscriptionType} subscription ${performer?.name || performer?.username}`,
  //       description: `recurring ${subscriptionType} subscription ${performer?.name || performer?.username}`,
  //       productId: performerId,
  //       productType: PAYMENT_TARGET_TYPE.PERFORMER,
  //       performerId
  //     }],
  //     couponInfo: null,
  //     status: PAYMENT_STATUS.SUCCESS,
  //     paymentResponseInfo: payload
  //   });
  // }

  public async subscribePerformer(payload: SubscribePerformerPayload, user: UserDto) {
    const { type, performerId } = payload;
    const paymentGateway = SettingService.getValueByKey(SETTING_KEYS.PAYMENT_GATEWAY) || 'verotel';
    const performer = await this.performerService.findById(performerId);
    if (!performer) throw new EntityNotFoundException();
    // eslint-disable-next-line no-nested-ternary
    let subscriptionType = PAYMENT_TYPE.MONTHLY_SUBSCRIPTION;
    switch (type) {
      case SUBSCRIPTION_TYPE.TRIAL:
        subscriptionType = PAYMENT_TYPE.TRIAL_SUBSCRIPTION;
        break;
      case SUBSCRIPTION_TYPE.SIX_MONTH:
        subscriptionType = PAYMENT_TYPE.SIX_MONTH_SUBSCRIPTION;
        break;
      case SUBSCRIPTION_TYPE.ONE_TIME:
        subscriptionType = PAYMENT_TYPE.ONE_TIME_SUBSCRIPTION;
        break;
      default: subscriptionType = PAYMENT_TYPE.MONTHLY_SUBSCRIPTION;
    }
    const transaction = await this.createSubscriptionPaymentTransaction(performer, subscriptionType, user, paymentGateway);

    if (paymentGateway === 'verotel') {
      const data = await this.verotelService.createRecurringRequestFromTransaction(transaction, {
        description: `${subscriptionType.split('_').join(' ')} ${performer?.name || performer?.username}`,
        userId: `${user._id}`,
        performer
      });
      transaction.verotelSignatureToken = data.signature;
      await transaction.save();
      return data;
    }
    // if (paymentGateway === 'ccbill') {
    //   const { flexformId, recurringSubAccountNumber, salt } = await this.getCCbillPaymentGatewaySettings();
    //   return this.ccbillService.subscription({
    //     transactionId: transaction._id,
    //     price: transaction.totalPrice,
    //     flexformId,
    //     salt,
    //     recurringSubAccountNumber,
    //     subscriptionType
    //   });
    // }

    return new PaymentDto(transaction).toResponse();
  }

  public async createTokenPaymentTransaction(
    products: any[],
    paymentGateway: string,
    totalPrice: number,
    transactionCost: number,
    user: UserDto,
    couponInfo?: CouponDto
  ) {
    const paymentTransaction = new this.TransactionModel();
    paymentTransaction.originalPrice = totalPrice - transactionCost;
    paymentTransaction.transactionCost = transactionCost;
    paymentTransaction.paymentGateway = paymentGateway || 'verotel';
    paymentTransaction.source = 'user';
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PAYMENT_TARGET_TYPE.TOKEN_PACKAGE;
    paymentTransaction.targetId = products[0].productId;
    paymentTransaction.performerId = null;
    paymentTransaction.type = PAYMENT_TYPE.TOKEN_PACKAGE;
    paymentTransaction.totalPrice = couponInfo ? totalPrice - parseFloat((totalPrice * couponInfo.value).toFixed(2)) : totalPrice;
    paymentTransaction.products = products;
    paymentTransaction.paymentResponseInfo = null;
    paymentTransaction.status = PAYMENT_STATUS.CREATED;
    paymentTransaction.couponInfo = couponInfo;
    await paymentTransaction.save();
    return paymentTransaction;
  }

  public async buyTokens(payload: PurchaseTokenPayload, user: UserDto) {
    const {
      couponCode, amount
    } = payload;
    const paymentGateway = SettingService.getValueByKey(SETTING_KEYS.PAYMENT_GATEWAY) || 'verotel';

    const settingTransactionCost = await this.settingService.getKeyValue(SETTING_KEYS.TRANSACTION_COST);
    const transactionCost = Number((amount * settingTransactionCost).toFixed(2));
    const totalPrice = parseFloat((amount + transactionCost).toFixed(2)) || 0;
    const products = [{
      price: totalPrice,
      quantity: 1,
      name: 'Wallet',
      description: `Top up Wallet $${amount}`,
      productId: null,
      productType: PAYMENT_TARGET_TYPE.TOKEN_PACKAGE,
      performerId: null,
      tokens: amount
    }];

    let coupon = null;
    if (couponCode) {
      coupon = await this.couponService.applyCoupon(couponCode, user._id);
    }

    const transaction = await this.createTokenPaymentTransaction(
      products,
      paymentGateway,
      totalPrice,
      transactionCost,
      user,
      coupon
    );

    if (paymentGateway === 'verotel') {
      const data = await this.verotelService.createSingleRequestFromTransaction(transaction, {
        description: products[0].description,
        userId: `${user._id}`
      });
      transaction.verotelSignatureToken = data.signature;
      await transaction.save();

      return data;
    }
    // if (paymentGateway === 'ccbill') {
    //   const { flexformId, singleSubAccountNumber, salt } = await this.getCCbillPaymentGatewaySettings();
    //   return this.ccbillService.singlePurchase({
    //     salt,
    //     flexformId,
    //     singleSubAccountNumber,
    //     price: coupon ? totalPrice - (totalPrice * coupon.value) : totalPrice,
    //     transactionId: transaction._id
    //   });
    // }
    throw new MissingConfigPaymentException();
  }

  // public async ccbillSinglePaymentSuccessWebhook(payload: Record<string, any>) {
  //   const transactionId = payload['X-transactionId'] || payload.transactionId;
  //   if (!transactionId) {
  //     throw new BadRequestException();
  //   }
  //   if (!isObjectId(transactionId)) {
  //     return { ok: false };
  //   }
  //   const transaction = await this.TransactionModel.findById(
  //     transactionId
  //   );
  //   if (!transaction) {
  //     return { ok: false };
  //   }
  //   transaction.status = PAYMENT_STATUS.SUCCESS;
  //   transaction.paymentResponseInfo = payload;
  //   transaction.updatedAt = new Date();
  //   await transaction.save();
  //   await this.queueEventService.publish(
  //     new QueueEvent({
  //       channel: TRANSACTION_SUCCESS_CHANNEL,
  //       eventName: EVENT.CREATED,
  //       data: new PaymentDto(transaction)
  //     })
  //   );
  //   const redirectUrl = `/payment/success?transactionId=${transaction._id.toString().slice(16, 24)}`;
  //   redirectUrl && await this.socketUserService.emitToUsers(transaction.sourceId, 'payment_status_callback', { redirectUrl });
  //   return { ok: true };
  // }

  // public async ccbillRenewalSuccessWebhook(payload: any) {
  //   const subscriptionId = payload.subscriptionId || payload.subscription_id;
  //   if (!subscriptionId) {
  //     throw new BadRequestException();
  //   }
  //   const subscription = await this.subscriptionService.findBySubscriptionId(subscriptionId);
  //   if (!subscription) {
  //     return { ok: false };
  //   }
  //   const transaction = await this.createCCbillRenewalSubscriptionPaymentTransaction(subscription, payload);
  //   await this.queueEventService.publish(
  //     new QueueEvent({
  //       channel: TRANSACTION_SUCCESS_CHANNEL,
  //       eventName: EVENT.CREATED,
  //       data: new PaymentDto(transaction)
  //     })
  //   );
  //   return { ok: true };
  // }

  // public async ccbillCancelSubscription(id: any, user: UserDto) {
  //   const subscription = await this.subscriptionService.findById(id);
  //   if (!subscription) {
  //     throw new EntityNotFoundException();
  //   }
  //   if (!user.roles.includes('admin') && `${subscription.userId}` !== `${user._id}`) {
  //     throw new ForbiddenException();
  //   }
  //   if (!subscription.subscriptionId) {
  //     subscription.status = SUBSCRIPTION_STATUS.DEACTIVATED;
  //     await subscription.save();
  //     await Promise.all([
  //       this.performerService.updateSubscriptionStat(subscription.performerId, -1),
  //       this.userService.updateStats(subscription.userId, { 'stats.totalSubscriptions': -1 })
  //     ]);
  //     return { success: true };
  //   }
  //   const { subscriptionId } = subscription;
  //   const [ccbillClientAccNo, ccbillDatalinkUsername, ccbillDatalinkPassword] = await Promise.all([
  //     this.settingService.getKeyValue(SETTING_KEYS.CCBILL_CLIENT_ACCOUNT_NUMBER),
  //     this.settingService.getKeyValue(SETTING_KEYS.CCBILL_DATALINK_USERNAME),
  //     this.settingService.getKeyValue(SETTING_KEYS.CCBILL_DATALINK_PASSWORD)
  //   ]);
  //   if (!ccbillClientAccNo || !ccbillDatalinkUsername || !ccbillDatalinkPassword) {
  //     throw new MissingConfigPaymentException();
  //   }
  //   const resp = await axios.get(`${ccbillCancelUrl}?subscriptionId=${subscriptionId}&username=${ccbillDatalinkUsername}&password=${ccbillDatalinkPassword}&action=cancelSubscription&clientAccnum=${ccbillClientAccNo}`);
  //   // TODO tracking data response
  //   if (resp?.data && resp?.data.includes('"results"\n"1"\n')) {
  //     subscription.status = SUBSCRIPTION_STATUS.DEACTIVATED;
  //     subscription.updatedAt = new Date();
  //     await subscription.save();
  //     await Promise.all([
  //       this.performerService.updateSubscriptionStat(subscription.performerId, -1),
  //       this.userService.updateStats(subscription.userId, { 'stats.totalSubscriptions': -1 })
  //     ]);
  //     return { success: true };
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"0"\n')) {
  //     throw new HttpException('The requested action failed.', 400);
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"-1"\n')) {
  //     throw new HttpException('The arguments provided to authenticate the merchant were invalid or missing.', 400);
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"-2"\n')) {
  //     throw new HttpException('The subscription id provided was invalid or the subscription type is not supported by the requested action.', 400);
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"-3"\n')) {
  //     throw new HttpException('No record was found for the given subscription.', 400);
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"-4"\n')) {
  //     throw new HttpException('The given subscription was not for the account the merchant was authenticated on.', 400);
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"-5"\n')) {
  //     throw new HttpException('The arguments provided for the requested action were invalid or missing.', 400);
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"-6"\n')) {
  //     throw new HttpException('The requested action was invalid', 400);
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"-7"\n')) {
  //     throw new HttpException('There was an internal error or a database error and the requested action could not complete.', 400);
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"-8"\n')) {
  //     throw new HttpException('The IP Address the merchant was attempting to authenticate on was not in the valid range.', 400);
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"-9"\n')) {
  //     throw new HttpException('The merchant’s account has been deactivated for use on the Datalink system or the merchant is not permitted to perform the requested action', 400);
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"-10"\n')) {
  //     throw new HttpException('The merchant has not been set up to use the Datalink system.', 400);
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"-11"\n')) {
  //     throw new HttpException('Subscription is not eligible for a discount, recurring price less than $5.00.', 400);
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"-12"\n')) {
  //     throw new HttpException('The merchant has unsuccessfully logged into the system 3 or more times in the last hour. The merchant should wait an hour before attempting to login again and is advised to review the login information.', 400);
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"-15"\n')) {
  //     throw new HttpException('Merchant over refund threshold', 400);
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"-16"\n')) {
  //     throw new HttpException('Merchant over void threshold', 400);
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"-23"\n')) {
  //     throw new HttpException('Transaction limit reached', 400);
  //   }
  //   if (resp?.data && resp?.data.includes('"results"\n"-24"\n')) {
  //     throw new HttpException('Purchase limit reached', 400);
  //   }

  //   throw new HttpException('Cancel subscription has been fail, please try again later', 400);
  // }

  // public async ccbillUserReactivation(payload: any) {
  //   const { subscriptionId } = payload;
  //   const subscription = await this.subscriptionService.findBySubscriptionId(subscriptionId);
  //   if (!subscription) {
  //     throw new EntityNotFoundException();
  //   }
  //   subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
  //   subscription.updatedAt = new Date();
  //   await subscription.save();
  //   await Promise.all([
  //     this.performerService.updateSubscriptionStat(subscription.performerId, 1),
  //     this.userService.updateStats(subscription.userId, { 'stats.totalSubscriptions': 1 })
  //   ]);
  // }

  public async verotelSuccessWebhook(payload: any) {
    const isValid = await this.verotelService.isValidSignatureFromQuery(payload);
    if (!isValid) throw new HttpException('Invalid signature', 403);
    // TODO - in order we have to recalculate signature
    const transaction = await this.TransactionModel.findOne({
      _id: payload.referenceID
    });
    if (!transaction) throw new HttpException('Transaction was not found', 404);
    let subPerformerId;
    let commissionPrivilege;
    if (transaction.performerId) {
      const performer = await this.performerService.findById(transaction.performerId);
      if (performer?.accountManager === ACCOUNT_MANAGER.AGENCY_MANAGED) {
        if (performer?.setEarningAgency === SET_EARNING_AGENCY.TOTAL) {
          const data = await this.userService.findOne({
            mainSourceId: performer._id,
            roles: ROLE_SUB_PERFORMER,
            status: 'active',
            usingSubAccount: true
          });
          subPerformerId = data ? data?._id : null;
          commissionPrivilege = performer?.commissionExternalAgency;
        } else {
          const data = await this.subPerformerService.getMyListForFind(performer._id, 'all', 'subscription');
          subPerformerId = data.length > 0 ? data[0]?._id : null;
          commissionPrivilege = data.length > 0 ? data[0]?.commissionPrivilege : null;
        }
      }
    }
    // single payment success or first time for recurring request
    if (['purchase'].includes(payload.type) || (['subscription'].includes(payload.type) && payload.event === 'initial')) {
      if (transaction.status !== PAYMENT_STATUS.CREATED) throw new Error('Invalid transaction status');

      transaction.status = PAYMENT_STATUS.SUCCESS;
      transaction.paymentResponseInfo = payload;
      transaction.updatedAt = new Date();
      await transaction.save();
      await this.queueEventService.publish(
        new QueueEvent({
          channel: TRANSACTION_SUCCESS_CHANNEL,
          eventName: EVENT.CREATED,
          data: subPerformerId ? {
            ...new PaymentDto(transaction),
            subPerformerId,
            commissionPrivilege
          } : {
            ...new PaymentDto(transaction)
          }
        })
      );
      return true;
    }

    // successful rebill transaction
    if (payload.type === 'subscription' && payload.subscriptionType === 'recurring' && payload.event === 'rebill') {
      const subscription = await this.subscriptionService.findOneSubscription({ transactionId: payload.referenceID }) || await this.subscriptionService.findBySubscriptionId(payload.saleId);
      if (!subscription || !subscription.performerId) {
        throw new HttpException('Transaction was not found', 404);
      }

      if (transaction.type !== PAYMENT_TYPE.TRIAL_SUBSCRIPTION) {
        // other subscription type
        await this.TransactionModel.updateOne({ _id: transaction._id }, { status: PAYMENT_STATUS.SUCCESS });
        await this.queueEventService.publish(
          new QueueEvent({
            channel: TRANSACTION_SUCCESS_CHANNEL,
            eventName: EVENT.CREATED,
            data: subPerformerId ? {
              ...new PaymentDto(transaction),
              subPerformerId,
              commissionPrivilege
            } : {
              ...new PaymentDto(transaction)
            }
          })
        );
      } else {
        // trial subscription update data
        const performer = await this.performerService.findById(subscription.performerId);
        if (!performer) {
          throw new HttpException('Performer was not found', 404);
        }
        const percentage = Number((transaction.transactionCost / (transaction.totalPrice - transaction.transactionCost)).toFixed(2));
        const transactionCost = Number(((payload.amount * percentage) / (1 + percentage)).toFixed(2));

        transaction.status = PAYMENT_STATUS.SUCCESS;
        transaction.type = PAYMENT_TYPE.MONTHLY_SUBSCRIPTION;
        transaction.totalPrice = Number(payload.amount);
        transaction.originalPrice = Number(payload.amount) - transactionCost;
        transaction.transactionCost = transactionCost;
        transaction.products = [{
          description: `${PAYMENT_TYPE.MONTHLY_SUBSCRIPTION.split('_').join(' ')} ${performer?.name || performer?.username}`,
          name: `${PAYMENT_TYPE.MONTHLY_SUBSCRIPTION.split('_').join(' ')} ${performer?.name || performer?.username}`,
          price: Number(payload.amount),
          productId: subscription.performerId || performer._id,
          productType: 'performer',
          quantity: 1
        }];

        await transaction.save();

        await this.queueEventService.publish(
          new QueueEvent({
            channel: TRANSACTION_SUCCESS_CHANNEL,
            eventName: EVENT.CREATED,
            data: subPerformerId ? {
              ...new PaymentDto(transaction),
              subPerformerId,
              commissionPrivilege
            } : {
              ...new PaymentDto(transaction)
            }
          })
        );
      }
    }

    return true;
  }

  public async verotelCancelSubscription(id: any, user: UserDto) {
    const subscription = await this.subscriptionService.findById(id);
    if (!subscription) {
      throw new EntityNotFoundException();
    }
    if (!user.roles.includes('admin') && `${subscription.userId}` !== `${user._id}`) {
      throw new ForbiddenException();
    }
    if (!subscription.subscriptionId) {
      subscription.status = SUBSCRIPTION_STATUS.DEACTIVATED;
      await subscription.save();
      await Promise.all([
        this.performerService.updateSubscriptionStat(subscription.performerId, -1),
        this.userService.updateStats(subscription.userId, { 'stats.totalSubscriptions': -1 })
      ]);
      return { success: true };
    }
    await this.verotelService.cancelSubscription(subscription.subscriptionId);
    subscription.status = SUBSCRIPTION_STATUS.DEACTIVATED;
    subscription.updatedAt = new Date();
    await subscription.save();
    await Promise.all([
      this.performerService.updateSubscriptionStat(subscription.performerId, -1),
      this.userService.updateStats(subscription.userId, { 'stats.totalSubscriptions': -1 })
    ]);
    return { success: true };
  }
}
