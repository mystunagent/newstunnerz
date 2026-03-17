import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { FileDto } from 'src/modules/file';

export interface IPerformerResponse {
  _id?: ObjectId;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneCode?: string; // international code prefix
  status?: string;
  avatar?: string;
  cover?: string;
  idVerificationId?: ObjectId;
  documentVerificationId?: ObjectId;
  gender?: string;
  accountManager?: string;
  country?: string;
  city?: string;
  state?: string;
  sentence?: string;
  zipcode?: string;
  privileges?: string[];
  address?: string;
  languages?: string[];
  categoryIds?: ObjectId[];
  height?: string;
  weight?: string;
  bio?: string;
  commissionExternalAgency?: number;
  eyes?: string;
  breastSize?: string;
  hair?: string;
  butt?: string;
  ethnicity?: string;
  sexualOrientation?: string;
  isTrialSubscription?: boolean;
  durationTrialSubscriptionDays?: number;
  trialPrice?: number;
  monthlyPrice?: number;
  isSixMonthSubscription?: boolean;
  sixMonthPrice?: number;
  isOneTimeSubscription?: boolean;
  durationOneTimeSubscriptionDays?: number;
  oneTimePrice?: number;
  publicChatPrice?: number;
  groupChatPrice?: number;
  privateChatPrice?: number;
  bookingStreamPrice?: number;
  stats?: {
    likes?: number;
    subscribers?: number;
    views?: number;
    totalVideos?: number;
    totalPhotos?: number;
    totalGalleries?: number;
    totalProducts?: number;
    totalStreamTime?: number;
    followers?: number;
  };
  verifiedEmail?: boolean;
  verifiedAccount?: boolean;
  verifiedDocument?: boolean;
  completedAccount?: boolean;
  score?: number;
  bankingInformation?: any;
  infoSubPerformer?: any;
  isSubscribed?: any;
  // paypalSetting?: any;
  commissionSetting?: any;
  blockCountries?: any;
  createdBy?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  isOnline?: boolean;
  activateWelcomeVideo?: boolean;
  lastStreamingTime?: Date;
  maxParticipantsAllowed?: number;
  live?: number;
  pricePerMinuteBookStream?: number;
  streamingStatus?: string;
  twitterConnected?: boolean;
  googleConnected?: boolean;
  dateOfBirth?: Date;
  bodyType?: string;
  balance?: number;
  socialsLink?: {
    facebook: String;
    twitter: String;
    google: String;
    instagram: String;
    linkedIn: String;
  };
  referrerId?: ObjectId | String;
  referrerInfo?: any;
  streamId?: string;
  liveInfo?: any;
  isFollowed?: boolean;
  commissionPercentage?: number;
  twitterUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  latestPaymentDate?: string | Date;
  totalLatestPaymentAmount?: number;
}

export class PerformerDto {
  _id: ObjectId;

  name?: string;

  firstName?: string;

  lastName?: string;

  username?: string;

  email?: string;

  phone?: string;

  phoneCode?: string; // international code prefix

  status?: string;

  privileges: string[];

  avatarId?: ObjectId;

  avatarPath?: string;

  accountManager?: string;

  coverId?: ObjectId;

  coverPath?: string;

  idVerificationId?: ObjectId;

  idVerification?: any;

  commissionExternalAgency?: number;

  documentVerificationId?: ObjectId;

  documentVerification?: any;

  verifiedEmail?: boolean;

  verifiedAccount?: boolean;

  verifiedDocument?: boolean;

  completedAccount?: boolean;

  twitterConnected?: boolean;

  googleConnected?: boolean;

  avatar?: any;

  cover?: any;

  gender?: string;

  breastSize?: string;

  country?: string;

  city?: string;

  state?: string;

  sentence?: string;

  zipcode?: string;

  address?: string;

  languages?: string[];

  categoryIds?: ObjectId[];

  height?: string;

  weight?: string;

  bio?: string;

  eyes?: string;

  hair?: string;

  setEarningAgency?: string;

  butt?: string;

  ethnicity?: string;

  mainSourceId?: string;

  sexualOrientation?: string;

  isTrialSubscription?: boolean;

  durationTrialSubscriptionDays?: number;

  trialPrice?: number;

  monthlyPrice?: number;

  isSixMonthSubscription?: boolean;

  sixMonthPrice?: number;

  isOneTimeSubscription?: boolean;

  infoSubPerformer?: any;

  nameSubPerformer?: any;

  infoBankSubPerformer?: any;

  durationOneTimeSubscriptionDays?: number;

  oneTimePrice?: number;

  publicChatPrice?: number;

  groupChatPrice?: number;

  privateChatPrice?: number;

  bookingStreamPrice?: number;

  pricePerMinuteBookStream?: number;

  stats?: {
    likes?: number;
    subscribers?: number;
    views?: number;
    totalVideos: number;
    totalPhotos: number;
    totalGalleries: number;
    totalProducts: number;
    totalFeeds: number;
    followers: number;
    totalStreamTime: number;
  };

  score?: number;

  bankingInformation?: any;

  // paypalSetting?: any;

  commissionSetting?: any;

  blockCountries?: any;

  createdBy?: ObjectId;

  createdAt?: Date;

  updatedAt?: Date;

  isOnline?: boolean;

  welcomeVideoId?: ObjectId;

  welcomeVideoPath?: string;

  welcomeVideoName?: string;

  activateWelcomeVideo?: boolean;

  isBookMarked?: boolean;

  isSubscribed?: any;

  lastStreamingTime?: Date;

  maxParticipantsAllowed?: number;

  live?: number;

  streamingStatus?: string;

  dateOfBirth?: Date;

  bodyType?: string;

  balance: number;

  socialsLink?: {
    facebook: String;
    twitter: String;
    google: String;
    instagram: String;
    linkedIn: String;
  };

  isFollowed?: boolean;

  commissionPercentage?: number;

  ondatoIDV?: string;

  ondatoMetadata?: string;

  // jumioMetadata?: any;

  // jumioAccountId?: String;

  // jumioWorkflowId?: String;

  referrerId?: ObjectId;

  streamId?: string;

  referrerInfo?: any;

  liveInfo?: any;

  twitterUrl?: string;

  instagramUrl?: string;

  websiteUrl?: string;

  earnedAmount?: number;

  totalPaidAmount?: number;

  totalUnpaidAmount?: number;

  totalBalance?: number;

  welcomeMessageFileId?: string;

  welcomeMessagePath?: string;

  welcomeMessageText?: string;

  welcomeMessageFileType?: string;

  latestPaymentDate?: string;

  totalLatestPaymentAmount?: number;

  constructor(data?: Partial<any>) {
    data && Object.assign(
      this,
      pick(data, [
        '_id',
        'name',
        'firstName',
        'lastName',
        'username',
        'email',
        'phone',
        'phoneCode',
        'status',
        'avatarId',
        'avatarPath',
        'coverId',
        'coverPath',
        'accountManager',
        'idVerificationId',
        'idVerification',
        'commissionExternalAgency',
        'documentVerificationId',
        'idVerification',
        'documentVerification',
        'gender',
        'country',
        'city',
        'state',
        'privileges',
        'zipcode',
        'sentence',
        'breastSize',
        'mainSourceId',
        'infoSubPerformer',
        'nameSubPerformer',
        'infoBankSubPerformer',
        'address',
        'languages',
        'categoryIds',
        'height',
        'weight',
        'bio',
        'eyes',
        'hair',
        'butt',
        'ethnicity',
        'sexualOrientation',
        'isTrialSubscription',
        'setEarningAgency',
        'durationTrialSubscriptionDays',
        'trialPrice',
        'monthlyPrice',
        'isSixMonthSubscription',
        'sixMonthPrice',
        'isOneTimeSubscription',
        'durationOneTimeSubscriptionDays',
        'oneTimePrice',
        'publicChatPrice',
        'groupChatPrice',
        'privateChatPrice',
        'bookingStreamPrice',
        'stats',
        'score',
        'bankingInformation',
        // 'paypalSetting',
        'commissionSetting',
        'blockCountries',
        'pricePerMinuteBookStream',
        'createdBy',
        'createdAt',
        'updatedAt',
        'verifiedEmail',
        'verifiedAccount',
        'verifiedDocument',
        'completedAccount',
        'twitterConnected',
        'googleConnected',
        'isOnline',
        'welcomeVideoId',
        'welcomeVideoPath',
        'welcomeVideoName',
        'activateWelcomeVideo',
        'isBookMarked',
        'isSubscribed',
        'lastStreamingTime',
        'maxParticipantsAllowed',
        'live',
        'streamingStatus',
        'dateOfBirth',
        'bodyType',
        'balance',
        'socialsLink',
        'ondataIDV',
        'ondatoMetadata',
        // 'jumioMetadata',
        // 'jumioAccountId',
        // 'jumioWorkflowId',
        'referrerId',
        'streamId',
        'referrerInfo',
        'liveInfo',
        'isFollowed',
        'commissionPercentage',
        'twitterUrl',
        'instagramUrl',
        'websiteUrl',
        'earnedAmount',
        'totalPaidAmount',
        'totalUnpaidAmount',
        'welcomeMessageFileId',
        'welcomeMessageText',
        'welcomeMessagePath',
        'welcomeMessageFileType',
        'latestPaymentDate',
        'totalLatestPaymentAmount'
      ])
    );
  }

  toResponse(includePrivateInfo = false, isAdmin?: boolean) {
    const publicInfo = {
      _id: this._id,
      name: this.getName(),
      avatar: FileDto.getPublicUrl(this.avatarPath),
      cover: FileDto.getPublicUrl(this.coverPath),
      username: this.username,
      gender: this.gender,
      country: this.country,
      stats: this.stats,
      isOnline: this.isOnline,
      welcomeVideoPath: FileDto.getPublicUrl(this.welcomeVideoPath),
      welcomeVideoName: this.welcomeVideoName,
      activateWelcomeVideo: this.activateWelcomeVideo,
      verifiedAccount: this.verifiedAccount,
      isSubscribed: this.isSubscribed,
      lastStreamingTime: this.lastStreamingTime,
      live: this.live,
      streamingStatus: this.streamingStatus,
      dateOfBirth: this.dateOfBirth,
      isTrialSubscription: this.isTrialSubscription,
      durationTrialSubscriptionDays: this.durationTrialSubscriptionDays,
      trialPrice: this.trialPrice,
      monthlyPrice: this.monthlyPrice,
      isSixMonthSubscription: this.isSixMonthSubscription,
      sixMonthPrice: this.sixMonthPrice,
      isOneTimeSubscription: this.isOneTimeSubscription,
      durationOneTimeSubscriptionDays: this.durationOneTimeSubscriptionDays,
      oneTimePrice: this.oneTimePrice,
      publicChatPrice: this.publicChatPrice,
      groupChatPrice: this.groupChatPrice,
      privateChatPrice: this.privateChatPrice,
      bookingStreamPrice: this.bookingStreamPrice,
      maxParticipantsAllowed: this.maxParticipantsAllowed,
      height: this.height,
      weight: this.weight,
      hair: this.hair,
      accountManager: this.accountManager,
      commissionExternalAgency: this.commissionExternalAgency,
      butt: this.butt,
      sentence: this.sentence,
      blockCountries: this.blockCountries,
      ethnicity: this.ethnicity,
      bio: this.bio,
      eyes: this.eyes,
      breastSize: this.breastSize,
      bodyType: this.bodyType,
      mainSourceId: this.mainSourceId,
      sexualOrientation: this.sexualOrientation,
      isPerformer: true,
      completedAccount: this.completedAccount,
      isFollowed: this.isFollowed,
      twitterUrl: this.twitterUrl,
      pricePerMinuteBookStream: this.pricePerMinuteBookStream,
      instagramUrl: this.instagramUrl,
      websiteUrl: this.websiteUrl,
      infoSubPerformer: this.infoSubPerformer,
      nameSubPerformer: this.nameSubPerformer,
      infoBankSubPerformer: this.infoBankSubPerformer,
      welcomeMessageText: this.welcomeMessageText,
      welcomeMessagePath: FileDto.getPublicUrl(this.welcomeMessagePath),
      welcomeMessageFileType: this.welcomeMessageFileType,
      latestPaymentDate: this.latestPaymentDate,
      totalLatestPaymentAmount: this.totalLatestPaymentAmount
    };
    const privateInfo = {
      firstName: this.firstName,
      lastName: this.lastName,
      balance: this.balance,
      twitterConnected: this.twitterConnected,
      googleConnected: this.googleConnected,
      verifiedEmail: this.verifiedEmail,
      verifiedDocument: this.verifiedDocument,
      email: this.email,
      phone: this.phone,
      privileges: this.privileges,
      phoneCode: this.phoneCode,
      status: this.status,
      blockCountries: this.blockCountries,
      city: this.city,
      state: this.state,
      zipcode: this.zipcode,
      address: this.address,
      languages: this.languages,
      categoryIds: this.categoryIds,
      idVerificationId: this.idVerificationId,
      idVerification: this.idVerification,
      documentVerificationId: this.documentVerificationId,
      documentVerification: this.documentVerification,
      bankingInformation: this.bankingInformation,
      welcomeVideoId: this.welcomeVideoId,
      // paypalSetting: this.paypalSetting,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      referrerId: this?.referrerId || '',
      streamId: this?.streamId || '',
      referrerInfo: this?.referrerInfo || {},
      liveInfo: this?.liveInfo || {}
    };

    if (isAdmin) {
      return {
        ...publicInfo,
        ...privateInfo,
        commissionSetting: this.commissionSetting,
        ondatoIDV: this.ondatoIDV,
        ondatoMetadata: this.ondatoMetadata,
        // jumioMetadata: this.jumioMetadata,
        // jumioAccountId: this.jumioAccountId,
        // jumioWorkflowId: this.jumioWorkflowId,
        commissionPercentage: this.commissionPercentage,
        earnedAmount: this.earnedAmount,
        totalPaidAmount: this.totalPaidAmount,
        totalUnpaidAmount: this.totalUnpaidAmount
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

  getName() {
    if (this.name) return this.name;
    return [this.firstName || '', this.lastName || ''].join(' ');
  }

  toSearchResponse() {
    return {
      _id: this._id,
      name: this.getName(),
      avatar: FileDto.getPublicUrl(this.avatarPath),
      cover: FileDto.getPublicUrl(this.coverPath),
      country: this.country,
      username: this.username,
      gender: this.gender,
      stats: this.stats,
      height: this.height,
      city: this.city,
      weight: this.weight,
      eyes: this.eyes,
      score: this.score,
      breastSize: this.breastSize,
      sentence: this.sentence,
      accountManager: this.accountManager,
      commissionExternalAgency: this.commissionExternalAgency,
      isOnline: this.isOnline,
      isTrialSubscription: this.isTrialSubscription,
      durationTrialSubscriptionDays: this.durationTrialSubscriptionDays,
      verifiedAccount: this.verifiedAccount,
      live: this.live,
      streamingStatus: this.streamingStatus,
      isSubscribed: this.isSubscribed,
      isFollowed: this.isFollowed,
      pricePerMinuteBookStream: this.pricePerMinuteBookStream,
      dateOfBirth: this.dateOfBirth,
      referrerId: this.referrerId,
      streamId: this.streamId,
      liveInfo: this.liveInfo,
      welcomeMessageText: this.welcomeMessageText,
      welcomeMessagePath: FileDto.getPublicUrl(this.welcomeMessagePath),
      welcomeMessageFileType: this.welcomeMessageFileType
    };
  }

  toSearchUsernameResponse() {
    return {
      username: this.username
    };
  }

  
  toSearchInfoInsertedResponse() {
    return {
      breastSize: this.breastSize,
      butt: this.butt,
      ethnicity: this.ethnicity,
      hair: this.hair
    };
  }

  toPublicDetailsResponse() {
    return {
      _id: this._id,
      name: this.getName(),
      avatar: FileDto.getPublicUrl(this.avatarPath),
      cover: FileDto.getPublicUrl(this.coverPath),
      username: this.username,
      status: this.status,
      gender: this.gender,
      firstName: this.firstName,
      lastName: this.lastName,
      country: this.country,
      city: this.city,
      state: this.state,
      zipcode: this.zipcode,
      address: this.address,
      languages: this.languages,
      categoryIds: this.categoryIds,
      height: this.height,
      weight: this.weight,
      bio: this.bio,
      eyes: this.eyes,
      sentence: this.sentence,
      accountManager: this.accountManager,
      hair: this.hair,
      breastSize: this.breastSize,
      butt: this.butt,
      ethnicity: this.ethnicity,
      sexualOrientation: this.sexualOrientation,
      isTrialSubscription: this.isTrialSubscription,
      durationTrialSubscriptionDays: this.durationTrialSubscriptionDays,
      trialPrice: this.trialPrice,
      monthlyPrice: this.monthlyPrice,
      commissionExternalAgency: this.commissionExternalAgency,
      isSixMonthSubscription: this.isSixMonthSubscription,
      sixMonthPrice: this.sixMonthPrice,
      isOneTimeSubscription: this.isOneTimeSubscription,
      durationOneTimeSubscriptionDays: this.durationOneTimeSubscriptionDays,
      oneTimePrice: this.oneTimePrice,
      publicChatPrice: this.publicChatPrice,
      groupChatPrice: this.groupChatPrice,
      privateChatPrice: this.privateChatPrice,
      bookingStreamPrice: this.bookingStreamPrice,
      stats: this.stats,
      score: this.score,
      blockCountries: this.blockCountries,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isOnline: this.isOnline,
      welcomeVideoId: this.welcomeVideoId,
      welcomeVideoPath: FileDto.getPublicUrl(this.welcomeVideoPath),
      activateWelcomeVideo: this.activateWelcomeVideo,
      verifiedAccount: this.verifiedAccount,
      isBookMarked: this.isBookMarked,
      isSubscribed: this.isSubscribed,
      lastStreamingTime: this.lastStreamingTime,
      live: this.live,
      streamingStatus: this.streamingStatus,
      dateOfBirth: this.dateOfBirth,
      bodyType: this.bodyType,
      referrerId: this?.referrerId || '',
      streamId: this?.streamId || '',
      liveInfo: this?.liveInfo || {},
      isPerformer: true,
      isFollowed: this.isFollowed,
      pricePerMinuteBookStream: this.pricePerMinuteBookStream,
      twitterUrl: this.twitterUrl,
      instagramUrl: this.instagramUrl,
      websiteUrl: this.websiteUrl,
      welcomeMessageText: this.welcomeMessageText,
      welcomeMessagePath: FileDto.getPublicUrl(this.welcomeMessagePath),
      welcomeMessageFileType: this.welcomeMessageFileType
    };
  }
}
