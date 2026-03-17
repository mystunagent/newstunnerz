/* eslint-disable camelcase */
export interface IPerformer {
  _id: string;
  performerId: string;
  name: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  phoneCode: string;
  pricePerMinuteBookStream: number;
  avatarPath: string;
  avatar: any;
  infoBankSubPerformer?: any;
  coverPath: string;
  cover: any;
  infoSubPerformer: any;
  nameSubPerformer: any;
  gender: string;
  country: string;
  city: string;
  state: string;
  zipcode: string;
  address: string;
  languages: string[];
  studioId: string;
  optionStream: any;
  categoryIds: string[];
  timezone: string;
  noteForUser: string;
  height: string;
  weight: string;
  breastSize: string;
  bio: string;
  sentence: string;
  eyes: string;
  sexualOrientation: string;
  isFreeSubscription: boolean;
  isTrialSubscription: boolean;
  durationFreeSubscriptionDays: number;
  durationTrialSubscriptionDays: number;
  trialPrice: number;
  monthlyPrice: number;
  isSixMonthSubscription: boolean;
  sixMonthPrice: number;
  isOneTimeSubscription: boolean;
  durationOneTimeSubscriptionDays: number;
  oneTimePrice: number;
  stats: {
    likes: number;
    subscribers: number;
    views: number;
    totalVideos: number;
    totalPhotos: number;
    totalGalleries: number;
    totalProducts: number;
    totalFeeds: number;
    followers: number;
  };
  score: number;
  bankingInformation: IBanking;
  blockCountries: IBlockCountries;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isOnline: number;
  verifiedAccount: boolean;
  verifiedEmail: boolean;
  verifiedDocument: boolean;
  completedAccount: boolean;
  twitterConnected: boolean;
  googleConnected: boolean;
  welcomeVideoId: string;
  accountManager: string;
  welcomeVideoPath: string;
  welcomeVideoName: string;
  activateWelcomeVideo: boolean;
  isBookMarked: boolean;
  isSubscribed: boolean;
  live: number;
  streamingStatus: string;
  ethnicity: string;
  butt: string;
  hair: string;
  pubicHair: string;
  idVerification: any;
  documentVerification: any;
  bodyType: string;
  dateOfBirth: Date;
  publicChatPrice: number;
  groupChatPrice: number;
  privateChatPrice: number;
  balance: number;
  socialsLink: {
    facebook: string;
    google: string;
    instagram: string;
    twitter: string;
    linkedIn: string;
  };
  isPerformer: boolean;
  isFollowed: boolean;
  referrerId: string;
  referrerInfo?: any;
  liveInfo?: any;
  twitterUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  welcomeMessageText?: string;
  welcomeMessagePath?: string;
  welcomeMessageFileType?: string;
}

export interface IBanking {
  type: string;
  performerId: string;
  sepa_beneficiary_name: string;
  sepa_beneficiary_iban: string;
  sepa_currency: string;
  beneficiary_name: string;
  beneficiary_street: string;
  beneficiary_city: string;
  beneficiary_postal_code : string;
  beneficiary_country_code: string;
  beneficiary_account: string;
  bic_code: string;
  intermediary_bank_bic_code: string;
  currency: string;
}

export interface IPerformerStats {
  totalGrossPrice: number;
  totalSiteCommission: number;
  totalNetPrice: number;
  totalTransactionCost?: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
}

export interface IBlockCountries {
  countryCodes: string[];
}

export interface IBlockedByPerformer {
  userId: string;
  description: string;
}
