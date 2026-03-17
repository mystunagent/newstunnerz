// https://controlcenter.verotel.com/flexpay-doc/subscription.html#create-a-subscription-order
import { HttpException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { sortBy } from 'lodash';
// import { Model } from 'mongoose';
import axios from 'axios';
import { PerformerDto } from 'src/modules/performer/dtos';
import {
  // BitsafeConnectAccountModel,
  PaymentTransactionModel
} from '../models';
import { PAYMENT_TYPE } from '../constants';
// import { BITSAFE_ACCOUNT_CONNECT_MODEL_PROVIDER } from '../providers';

interface OptionPaymentVerotel {
  userId: string;
  performer?: PerformerDto;
  description: string;
  commissionPercentage?: number;
}

@Injectable()
export class VerotelService {
  constructor(
    private readonly settingService: SettingService
    // @Inject(BITSAFE_ACCOUNT_CONNECT_MODEL_PROVIDER)
    // private readonly ConnectAccountModel: Model<BitsafeConnectAccountModel>
  ) {}

  public async createSingleRequestFromTransaction(transaction: PaymentTransactionModel, options?: OptionPaymentVerotel) {
    const [
      VEROTEL_API_VERSION,
      VEROTEL_CURRENCY,
      VEROTEL_FLEXPAY_SIGNATURE_KEY,
      VEROTEL_SHOP_ID,
      VEROTEL_TEST_MODE
    ] = await Promise.all([
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_API_VERSION),
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_CURRENCY),
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_FLEXPAY_SIGNATURE_KEY),
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_SHOP_ID),
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_TEST_MODE)
    ]);
    /**
     * The "startorder" request for FlexPay purchase consists of number of parameters passed to
    "https://secure.verotel.com/startorder?" for Verotel accounts or
    "https://secure.billing.creditcard/startorder?" for CardBilling accounts and is secured by a
    signature.

    The signature used in FlexPay requests and postbacks is calculated as SHA-1 hash (hexadecimal
    output) from the request parameters.
    The first parameter has to be your signatureKey, followed by the parameters ordered alphabetically
    by their names.
    Optional arguments that are used (have value) must be contained in the signature calculation.
    Optional arguments that are not used must not be contained in the signature calculation.
    The email parameter in "startorder" request is not included in the signature calculations.
    It is mandatory to convert arguments values into UTF-8 before computing the signature.
    e.g.
    signature = sha1_hex( signatureKey + ":description=" + description + ":period=" + period +
    ":priceAmount=" + priceAmount + ":priceCurrency=" + priceCurrency + ":referenceID=" +
    referenceID + ":shopID=" + shopID + ":subscriptionType=" + subscriptionType + ":type=" + type +
    ":version=" + version )
     */
    const description = options?.description || `One time payment for ${transaction.type}`;
    // priceAmount amount to be processed. in nnn.nn formatt
    const priceAmount = transaction.totalPrice.toFixed(2);
    const shasum = createHash('sha256');
    shasum.update(`${VEROTEL_FLEXPAY_SIGNATURE_KEY}:custom1=${options?.userId}:description=${description}:priceAmount=${priceAmount}:priceCurrency=${VEROTEL_CURRENCY}:referenceID=${transaction._id}:shopID=${VEROTEL_SHOP_ID}:type=purchase:version=${VEROTEL_API_VERSION}`);
    const signature = shasum.digest('hex');
    const payUrl = new URL(
      VEROTEL_TEST_MODE
        ? 'https://secure.verotel.com/startorder'
        : 'https://secure.billing.creditcard/startorder'
    );
    payUrl.searchParams.append('custom1', options?.userId);
    payUrl.searchParams.append('description', description);
    payUrl.searchParams.append('priceAmount', priceAmount);
    payUrl.searchParams.append('priceCurrency', VEROTEL_CURRENCY);
    payUrl.searchParams.append('referenceID', transaction._id);
    payUrl.searchParams.append('shopID', VEROTEL_SHOP_ID);
    payUrl.searchParams.append('type', 'purchase');
    payUrl.searchParams.append('version', VEROTEL_API_VERSION);
    payUrl.searchParams.append('signature', signature);
    return {
      paymentUrl: payUrl.href,
      signature
    };
  }

  public async createRecurringRequestFromTransaction(transaction: PaymentTransactionModel, options: OptionPaymentVerotel) {
    const [
      VEROTEL_API_VERSION,
      VEROTEL_CURRENCY,
      VEROTEL_FLEXPAY_SIGNATURE_KEY,
      VEROTEL_SHOP_ID,
      VEROTEL_TEST_MODE,
      transactionCostPercentage
      // performerBitsafeConnect
    ] = await Promise.all([
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_API_VERSION),
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_CURRENCY),
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_FLEXPAY_SIGNATURE_KEY),
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_SHOP_ID),
      this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_TEST_MODE),
      this.settingService.getKeyValue(SETTING_KEYS.TRANSACTION_COST)
      // this.ConnectAccountModel.findOne({ sourceId: transaction.performerId })
    ]);

    // if (!performerBitsafeConnect || !performerBitsafeConnect?.publicToken) throw new HttpException('This model has not connected with Bitsafe, please try again later', 422);

    /**
     * The "startorder" request for FlexPay purchase consists of number of parameters passed to
    "https://secure.verotel.com/startorder?" for Verotel accounts or
    "https://secure.billing.creditcard/startorder?" for CardBilling accounts and is secured by a
    signature.

    The signature used in FlexPay requests and postbacks is calculated as SHA-1 hash (hexadecimal
    output) from the request parameters.
    The first parameter has to be your signatureKey, followed by the parameters ordered alphabetically
    by their names.
    Optional arguments that are used (have value) must be contained in the signature calculation.
    Optional arguments that are not used must not be contained in the signature calculation.
    The email parameter in "startorder" request is not included in the signature calculations.
    It is mandatory to convert arguments values into UTF-8 before computing the signature.
    e.g.
    signature = sha1_hex( signatureKey + ":description=" + description + ":period=" + period +
    ":priceAmount=" + priceAmount + ":priceCurrency=" + priceCurrency + ":referenceID=" +
    referenceID + ":shopID=" + shopID + ":subscriptionType=" + subscriptionType + ":type=" + type +
    ":version=" + version )
    "one-time" subscriptions - simply expire after the time specified in "period" parameter.
     "recurring" subscriptions - will attempt to rebill the buyer in order to stay active.
    The initial period can have different price and duration (set via "trialPeriod" and
    "trialAmount" parameters) then the following rebill periods (specified in "period" and
    "priceAmount" parameters).
     */
    const subscriptionType = transaction.type === PAYMENT_TYPE.ONE_TIME_SUBSCRIPTION ? 'one-time' : 'recurring';
    const description = options?.description || `${subscriptionType.replace('-', ' ')} payment for ${transaction.type}`;
    // priceAmount amount to be processed. in nnn.nn formatt
    // todo check trial total price
    const price = transaction.type === PAYMENT_TYPE.TRIAL_SUBSCRIPTION ? options.performer?.monthlyPrice * (1 + transactionCostPercentage) : transaction.totalPrice;
    const priceAmount = price.toFixed(2);

    // trialAmount amount to be processed. in nnn.nn formatt
    const trialPrice = transaction.type === PAYMENT_TYPE.TRIAL_SUBSCRIPTION ? (options.performer?.trialPrice || 1.99) * (1 + transactionCostPercentage) : null;
    const trialAmount = trialPrice ? trialPrice.toFixed(2) : null;
    // duration in ISO8601 format, for example: P30D, minimum is 7 days for "recurring" and 2 days for "one-time", maximum 180 days for "one-time"
    // eslint-disable-next-line no-nested-ternary
    const period = transaction.type === PAYMENT_TYPE.SIX_MONTH_SUBSCRIPTION
      ? 'P6M'
      : transaction.type === PAYMENT_TYPE.ONE_TIME_SUBSCRIPTION
        ? `P${options.performer?.durationOneTimeSubscriptionDays || 180}D`
        : 'P30D';

    // duration in ISO8601 format, for example: P30D, minimum is 2 days
    const trialPeriod = transaction.type === PAYMENT_TYPE.TRIAL_SUBSCRIPTION ? `P${options.performer?.durationTrialSubscriptionDays || 3}D` : null;

    const shasum = createHash('sha256');
    if (transaction.type === PAYMENT_TYPE.TRIAL_SUBSCRIPTION) {
      shasum.update(
        // `${VEROTEL_FLEXPAY_SIGNATURE_KEY}:custom1=${options.userId}:custom2=${options.performer._id}:custom3=${JSON.stringify({
        //   publicToken: performerBitsafeConnect?.publicToken,
        //   percentage: options.commissionPercentage
        // })}:name=${description}:period=${period}:priceAmount=${priceAmount}:priceCurrency=${VEROTEL_CURRENCY}:referenceID=${transaction._id}:shopID=${VEROTEL_SHOP_ID}:subscriptionType=${subscriptionType}:trialAmount=${trialAmount}:trialPeriod=${trialPeriod}:type=subscription:version=${VEROTEL_API_VERSION}`
        `${VEROTEL_FLEXPAY_SIGNATURE_KEY}:custom1=${options.userId}:custom2=${options.performer._id}:name=${description}:period=${period}:priceAmount=${priceAmount}:priceCurrency=${VEROTEL_CURRENCY}:referenceID=${transaction._id}:shopID=${VEROTEL_SHOP_ID}:subscriptionType=${subscriptionType}:trialAmount=${trialAmount}:trialPeriod=${trialPeriod}:type=subscription:version=${VEROTEL_API_VERSION}`
      );
    } else {
      shasum.update(
        // `${VEROTEL_FLEXPAY_SIGNATURE_KEY}:custom1=${options.userId}:custom2=${options.performer._id}:custom3=${JSON.stringify({
        //   publicToken: performerBitsafeConnect?.publicToken,
        //   percentage: options.commissionPercentage
        // })}:name=${description}:period=${period}:priceAmount=${priceAmount}:priceCurrency=${VEROTEL_CURRENCY}:referenceID=${transaction._id}:shopID=${VEROTEL_SHOP_ID}:subscriptionType=${subscriptionType}:type=subscription:version=${VEROTEL_API_VERSION}`
        `${VEROTEL_FLEXPAY_SIGNATURE_KEY}:custom1=${options.userId}:custom2=${options.performer._id}:name=${description}:period=${period}:priceAmount=${priceAmount}:priceCurrency=${VEROTEL_CURRENCY}:referenceID=${transaction._id}:shopID=${VEROTEL_SHOP_ID}:subscriptionType=${subscriptionType}:type=subscription:version=${VEROTEL_API_VERSION}`
      );
    }
    const signature = shasum.digest('hex');
    const payUrl = new URL(
      VEROTEL_TEST_MODE
        ? 'https://secure.verotel.com/startorder'
        : 'https://secure.billing.creditcard/startorder'
    );
    payUrl.searchParams.append('custom1', options.userId);
    payUrl.searchParams.append('custom2', `${transaction.performerId}`);
    // payUrl.searchParams.append('custom3', JSON.stringify({
    //   publicToken: performerBitsafeConnect?.publicToken,
    //   percentage: options.commissionPercentage
    // }));
    payUrl.searchParams.append('name', description);
    payUrl.searchParams.append('period', period);
    payUrl.searchParams.append('priceAmount', priceAmount);
    payUrl.searchParams.append('priceCurrency', VEROTEL_CURRENCY);
    payUrl.searchParams.append('referenceID', transaction._id);
    payUrl.searchParams.append('shopID', VEROTEL_SHOP_ID);
    payUrl.searchParams.append('subscriptionType', subscriptionType);
    transaction.type === PAYMENT_TYPE.TRIAL_SUBSCRIPTION && trialAmount && payUrl.searchParams.append('trialAmount', trialAmount);
    transaction.type === PAYMENT_TYPE.TRIAL_SUBSCRIPTION && trialPeriod && payUrl.searchParams.append('trialPeriod', trialPeriod);
    payUrl.searchParams.append('type', 'subscription');
    payUrl.searchParams.append('version', VEROTEL_API_VERSION);
    payUrl.searchParams.append('signature', signature);
    return {
      paymentUrl: payUrl.href,
      signature
    };
  }

  public async isValidSignatureFromQuery(query) {
    const VEROTEL_FLEXPAY_SIGNATURE_KEY = await this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_FLEXPAY_SIGNATURE_KEY);
    const arr = [] as any;
    Object.keys(query).forEach((key) => {
      if (key !== 'signature') {
        arr.push({
          key,
          value: query[key]
        });
      }
    });
    const sortArr = sortBy(arr, ['key']).map((item) => `${item.key}=${item.value}`);
    const txtToJoin = `${VEROTEL_FLEXPAY_SIGNATURE_KEY}:${sortArr.join(':')}`;

    const shasum = createHash('sha256');
    shasum.update(txtToJoin);
    const signature = shasum.digest('hex');
    return signature === query.signature;
  }

  public async cancelSubscription(saleId: string) {
    try {
      const [
        VEROTEL_API_VERSION,
        VEROTEL_FLEXPAY_SIGNATURE_KEY,
        VEROTEL_SHOP_ID,
        VEROTEL_TEST_MODE
      ] = await Promise.all([
        this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_API_VERSION),
        this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_FLEXPAY_SIGNATURE_KEY),
        this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_SHOP_ID),
        this.settingService.getKeyValue(SETTING_KEYS.VEROTEL_TEST_MODE)
      ]);

      const shasum = createHash('sha1');
      shasum.update(`${VEROTEL_FLEXPAY_SIGNATURE_KEY}:saleId:${saleId}:shopID=${VEROTEL_SHOP_ID}:version=${VEROTEL_API_VERSION}`);
      const signature = shasum.digest('hex');
      const cancelUrl = new URL(
        VEROTEL_TEST_MODE
          ? 'https://secure.verotel.com/cancel-subscription'
          : 'https://secure.billing.creditcard/cancel-subscription'
      );
      const resp = axios.get(`${cancelUrl}?shopId=${VEROTEL_SHOP_ID}&saleID=${saleId}&signature=${signature}&version=${VEROTEL_API_VERSION}`);
      return resp;
    } catch (e) {
      throw new HttpException(e, 400);
    }
  }
}
