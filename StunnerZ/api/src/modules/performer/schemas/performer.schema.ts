
import * as mongoose from 'mongoose';
import {
  GROUP_CHAT, OFFLINE, PRIVATE_CHAT, PUBLIC_CHAT
} from 'src/modules/stream/constant';
import { ACCOUNT_MANAGER } from '../constants';

const performerSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true
  },
  firstName: String,
  lastName: String,
  username: {
    type: String,
    index: true,
    unique: true,
    trim: true,
    // uniq if not null
    sparse: true
  },
  accountManager: {
    type: String,
    default: ACCOUNT_MANAGER.SELF_MANAGED
  },
  setEarningAgency: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    index: true,
    unique: true,
    lowercase: true,
    trim: true,
    // uniq if not null
    sparse: true
  },
  status: {
    type: String,
    index: true
  },
  dateOfBirth: {
    type: Date
  },
  bodyType: {
    type: String,
    index: true
  },
  phone: {
    type: String
  },
  phoneCode: String, // international code prefix
  avatarId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  avatarPath: String,
  coverId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  coverPath: String,
  idVerificationId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  documentVerificationId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  welcomeVideoId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  welcomeVideoPath: {
    type: String
  },
  activateWelcomeVideo: {
    type: Boolean,
    default: false
  },
  verifiedEmail: {
    type: Boolean,
    default: false
  },
  verifiedAccount: {
    type: Boolean,
    default: false
  },
  verifiedDocument: {
    type: Boolean,
    default: false
  },
  completedAccount: {
    // only performer has completed account will be showed in MODEL LISTING PAGE
    /**
     * Completed account is a account have:
     * verified ID document with Jumio / Ondato
     * bank account
     */
    type: Boolean,
    default: false
  },
  gender: {
    type: String,
    index: true
  },
  country: {
    type: String,
    index: true
  },
  city: String,
  state: String,
  zipcode: String,
  address: String,
  languages: [
    {
      type: String
    }
  ],
  studioId: mongoose.Schema.Types.ObjectId,
  categoryIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      _id: false
    }
  ],
  height: {
    type: String,
    index: true
  },
  weight: {
    type: String,
    index: true
  },
  bio: String,
  sentence: String,
  eyes: {
    type: String,
    index: true
  },
  hair: {
    type: String,
    index: true
  },
  breastSize: String,
  butt: {
    type: String,
    index: true
  },
  ethnicity: {
    type: String,
    index: true
  },
  sexualOrientation: {
    type: String,
    index: true
  },
  isTrialSubscription: {
    type: Boolean,
    default: true
  },
  durationTrialSubscriptionDays: {
    type: Number,
    default: 3
  },
  trialPrice: {
    type: Number,
    default: 1.99
  },
  bookingStreamPrice: {
    type: Number,
    default: 20
  },
  monthlyPrice: {
    type: Number,
    default: 10.99
  },
  isSixMonthSubscription: {
    type: Boolean,
    default: true
  },
  sixMonthPrice: {
    type: Number,
    default: 50.99
  },
  isOneTimeSubscription: {
    type: Boolean,
    default: true
  },
  durationOneTimeSubscriptionDays: {
    type: Number,
    default: 180
  },
  oneTimePrice: {
    type: Number,
    default: 60.99
  },
  publicChatPrice: {
    type: Number,
    default: 10
  },
  privateChatPrice: {
    type: Number,
    default: 1
  },
  groupChatPrice: {
    type: Number,
    default: 1
  },
  stats: {
    likes: {
      type: Number,
      default: 0
    },
    subscribers: {
      type: Number,
      default: 0
    },
    followers: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    },
    totalVideos: {
      type: Number,
      default: 0
    },
    totalPhotos: {
      type: Number,
      default: 0
    },
    totalGalleries: {
      type: Number,
      default: 0
    },
    totalProducts: {
      type: Number,
      default: 0
    },
    totalFeeds: {
      type: Number,
      default: 0
    },
    totalStreamTime: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  score: {
    type: Number,
    default: 0
  },
  isOnline: {
    type: Number,
    default: 0
  },
  onlineAt: {
    type: Date
  },
  offlineAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastStreamingTime: Date,
  maxParticipantsAllowed: {
    type: Number,
    default: 1
  },
  live: {
    type: Number,
    default: 0
  },
  streamingStatus: {
    type: String,
    enum: [PUBLIC_CHAT, PRIVATE_CHAT, GROUP_CHAT, OFFLINE],
    default: OFFLINE,
    index: true
  },
  twitterProfile: {
    type: mongoose.Schema.Types.Mixed
  },
  twitterConnected: {
    type: Boolean,
    default: false
  },
  googleProfile: {
    type: mongoose.Schema.Types.Mixed
  },
  googleConnected: {
    type: Boolean,
    default: false
  },
  balance: {
    type: Number,
    default: 0
  },
  // jumioMetadata: {
  //   type: Object
  // },
  // jumioAccountId: {
  //   type: String
  // },
  // jumioWorkflowId: {
  //   type: String
  // },
  ondatoIDV: String,
  ondatoMetadata: Object, // todo - should define
  referrerId: {
    type: mongoose.Schema.Types.ObjectId
  },
  streamId: {
    type: String
  },
  commissionPercentage: {
    type: Number
  },
  commissionExternalAgency: {
    type: Number
  },
  pricePerMinuteBookStream: {
    type: Number,
    default: 10
  },
  twitterUrl: {
    type: String
  },
  instagramUrl: {
    type: String
  },
  websiteUrl: {
    type: String
  },
  welcomeMessageText: String,
  welcomeMessagePath: String,
  welcomeMessageFileType: String,
  welcomeMessageFileId: mongoose.Schema.Types.ObjectId
});

performerSchema.pre<any>('updateOne', async function preUpdateOne(next) {
  const model = await this.model.findOne(this.getQuery());
  if (!model) return next();
  const { stats } = model;
  if (!stats) {
    return next();
  }
  const score = (stats.subscribers || 0) * 3 + (stats.likes || 0) * 2 + (stats.views || 0);
  model.score = score || 0;
  await model.save();
  return next();
});

export const PerformerSchema = performerSchema;
