import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class UserModel extends Document {
  name?: string;

  firstName?: string;

  lastName?: string;

  email?: string;

  phone?: string;

  roles?: string[];

  avatarId?: ObjectId;

  avatarPath?: string;

  status: string;

  balance?: number;

  username?: string;

  country?: string;

  gender?: string;

  isOnline?: boolean;

  onlineAt?: Date;

  offlineDat?: Date;

  commissionExternalAgency?: number;

  createdAt: Date;

  updatedAt: Date;

  verifiedEmail?: boolean;

  twitterProfile?: any;

  twitterConnected?: boolean;

  googleProfile?: any;

  googleConnected?: boolean;

  mainSourceId: ObjectId;

  setTypeCommissionAgency: string;

  stats: {
    totalSubscriptions: number;
    following: number;
  }
}
