export const PAYMENT_STATUS = {
  CREATED: 'created',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAIL: 'fail',
  CANCELED: 'canceled',
  REFUNDED: 'refunded',
  REQUIRE_AUTHENTICATION: 'require_authentication'
};

export const PAYMENT_TYPE = {
  TOKEN_PACKAGE: 'token_package',
  TRIAL_SUBSCRIPTION: 'trial_subscription',
  MONTHLY_SUBSCRIPTION: 'monthly_subscription',
  SIX_MONTH_SUBSCRIPTION: 'six_month_subscription',
  ONE_TIME_SUBSCRIPTION: 'one_time_subscription'
};

export const PAYMENT_TARGET_TYPE = {
  TOKEN_PACKAGE: 'token_package',
  PERFORMER: 'performer'
};

export const TRANSACTION_SUCCESS_CHANNEL = 'TRANSACTION_SUCCESS_CHANNEL';
export const MISSING_CONFIG_PAYMENT_GATEWAY = 'Missing config for this payment method';
export const EVENT_TOKEN_TRANSACTION_SUCCESS_CHANNEL = 'EVENT_TOKEN_TRANSACTION_SUCCESS_CHANNEL';
export const REJECT_EVENT_TOKEN_TRANSACTION_SUCCESS_CHANNEL = 'REJECT_EVENT_TOKEN_TRANSACTION_SUCCESS_CHANNEL';
