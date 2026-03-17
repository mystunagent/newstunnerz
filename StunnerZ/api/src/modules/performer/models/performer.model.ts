import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { BankingModel } from './banking.model';
import { PaymentGatewaySettingModel } from './payment-gateway-setting.model';

export class PerformerModel extends Document {
  _id: ObjectId;

  name: string;

  firstName: string;

  lastName: string;

  username: string;

  email: string;

  phone: string;

  phoneCode: string; // international code prefix

  avatarId: ObjectId;

  avatarPath: string;

  coverId: ObjectId;

  coverPath: string;

  accountManager: string;

  commissionExternalAgency: number;

  breastSize: string;

  idVerificationId: ObjectId;

  documentVerificationId: ObjectId;

  verifiedEmail: boolean;

  verifiedAccount: boolean;

  verifiedDocument: boolean;

  completedAccount: boolean;

  status: string;

  gender: string;

  country: string;

  city: string;

  state: string;

  sentence: string;

  zipcode: string;

  address: string;

  setEarningAgency: string;

  languages: string[];

  agentId: ObjectId;

  height: string;

  weight: string;

  hair: string;

  butt: string;

  ethnicity: string;

  bio: string;

  eyes: string;

  sexualOrientation: string;

  dateOfBirth: Date;

  bodyType: string;

  isTrialSubscription: boolean;

  durationTrialSubscriptionDays: number;

  trialPrice: number;

  monthlyPrice: number;

  isSixMonthSubscription: boolean;

  sixMonthPrice: number;

  isOneTimeSubscription: boolean;

  durationOneTimeSubscriptionDays: number;

  oneTimePrice: number;

  bookingStreamPrice?: number;

  stats: {
    likes: number;
    subscribers: number;
    views: number;
    totalVideos: number;
    totalPhotos: number;
    totalGalleries: number;
    totalProducts: number;
    totalFeeds: number;
    totalStreamTime: number;
    followers: number;
  };

  bankingInfomation: BankingModel;

  ccbillSetting: PaymentGatewaySettingModel;

  // score custom from other info like likes, subscribes, views....
  score: number;

  createdBy: ObjectId;

  createdAt: Date;

  updatedAt: Date;

  isOnline: boolean;

  onlineAt: Date;

  offlineAt: Date;

  welcomeVideoId: ObjectId;

  welcomeVideoPath: string;

  activateWelcomeVideo: boolean;

  lastStreamingTime: Date;

  maxParticipantsAllowed: number;

  live: number;

  streamingStatus: string;

  twitterProfile: any;

  twitterConnected: boolean;

  googleProfile: any;

  googleConnected: boolean;

  privateChatPrice: number;

  publicChatPrice: number;

  groupChatPrice: number;

  roles: string[];

  balance: number;

  socialsLink: {
    facebook: String;
    twitter: String;
    google: String;
    instagram: String;
    linkedIn: String;
  };

  ondatoIDV: string;

  ondatoMetadata: any;

  // jumioMetadata: any;

  // jumioAccountId: String;

  // jumioWorkflowId: String;

  referrerId?: ObjectId;

  streamId?: string;

  commissionPercentage: number;

  pricePerMinuteBookStream: number;

  welcomeMessageText?: string;

  welcomeMessagePath?: string;

  welcomeMessageFileId?: ObjectId;

  welcomeMessageFileType?: string
}
