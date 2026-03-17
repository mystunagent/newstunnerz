export const ROLE_ADMIN = 'admin';
export const ROLE_USER = 'user';
export const ROLE_SUB_PERFORMER = 'sub_performer';
export const USER_ROLES = {
  ADMIN: ROLE_ADMIN,
  USER: ROLE_USER,
  SUB_PERFORMER: ROLE_SUB_PERFORMER
};

export const STATUS_PENDING_EMAIL_CONFIRMATION = 'pending-email-confirmation';
export const STATUS_ACTIVE = 'active';
export const STATUS_INACTIVE = 'inactive';

export const STATUSES = [
  STATUS_PENDING_EMAIL_CONFIRMATION,
  STATUS_ACTIVE,
  STATUS_INACTIVE
];

export const GENDER_MALE = 'male';
export const GENDER_FEMALE = 'female';
export const GENDER_TRANSGENDER = 'transgender';
export const GENDER_COUPLE = 'couple';

export const GENDERS = [GENDER_MALE, GENDER_FEMALE, GENDER_TRANSGENDER, GENDER_COUPLE];

export const DELETE_USER_CHANNEL = 'DELETE_USER_CHANNEL';
export const PERFORMER_PRIVILEGES = {
  ALL: 'all',
  SUB_ACCOUNT: 'sub_account',
  // DIRECT_MESSAGE: 'direct_message',
  SUBSCRIPTION_LIST: 'subscription_list',
  SUBSCRIPTION: 'subscription',
  // VIOLATION: 'violation',
  PAYOUT_REQUEST: 'payout_request',
  EDIT_PROFILE: 'edit_profile',
  BLACK_LIST: 'black_list',
  BLOCK_COUNTRIES: 'block_countries',
  REFERRAL: 'referral',
  POSTING: 'posting',
  MESSAGES: 'messages',
  TIP: 'tip',
  STREAMING: 'streaming',
  WELCOME_MESSAGE: 'welcome_message',
  MY_FEED: 'my_feed',
  AVAILABLE_TIME: 'available_time',
  BOOKING_STREAM: 'booking_stream',
  VIDEOS: 'videos',
  EVENTS: 'events',
  PRODUCTS: 'products',
  GALLERY: 'gallery',
  ORDER: 'order',
  EARNING: 'earning'
};

export const SET_EARNING_AGENCY = {
  TOTAL: 'total',
  INDIVIDUAL: 'individual'
};