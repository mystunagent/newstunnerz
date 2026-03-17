import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { FileDto } from 'src/modules/file';

export interface IUserResponse {
  _id?: ObjectId;
  name?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roles?: string[];
  avatar?: string;
  status?: string;
  gender?: string;
  balance?: number;
  commissionExternalAgency?: number;
  country?: string;
  verifiedEmail?: boolean;
  twitterConnected?: boolean;
  googleConnected?: boolean;
  isOnline?: boolean;
  setTypeCommissionAgency?: string;
  stats: {
    totalSubscriptions: number;
    following: number;
  }
  isBlocked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserDto {
  _id: ObjectId;

  name?: string;

  firstName?: string;

  lastName?: string;

  email?: string;

  avatar?: string;

  phone?: string;

  roles: string[] = ['user'];

  avatarId?: ObjectId;

  stats: {
    totalSubscriptions: number;
    following: number;
  }

  avatarPath?: string;

  status?: string;

  username?: string;

  gender?: string;

  mainSourceId?: string;

  infoPerformer?: any;

  balance?: number;

  commissionExternalAgency?: number;

  country?: string; // iso code

  verifiedEmail?: boolean;

  setTypeCommissionAgency: string;

  isOnline?: boolean;

  twitterConnected?: boolean;

  googleConnected?: boolean;

  isPerformer?: boolean;

  isBlocked?: boolean;

  verifiedAccount?: boolean;

  createdAt?: Date;

  updatedAt?: Date;

  constructor(data?: Partial<UserDto>) {
    data
      && Object.assign(
        this,
        pick(data, [
          '_id',
          'name',
          'firstName',
          'lastName',
          'email',
          'phone',
          'roles',
          'avatarId',
          'avatarPath',
          'commissionExternalAgency',
          'status',
          'username',
          'mainSourceId',
          'gender',
          'balance',
          'setTypeCommissionAgency',
          'country',
          'verifiedEmail',
          'infoPerformer',
          'verifiedAccount',
          'isOnline',
          'stats',
          'twitterConnected',
          'googleConnected',
          'isPerformer',
          'isBlocked',
          'createdAt',
          'updatedAt'
        ])
      );
  }

  getName() {
    if (this.name) return this.name;
    return [this.firstName || '', this.lastName || ''].join(' ');
  }

  toResponse(includePrivateInfo = false, isAdmin?: boolean): IUserResponse {
    const publicInfo = {
      _id: this._id,
      name: this.getName(),
      avatar: FileDto.getPublicUrl(this.avatarPath),
      username: this.username,
      isOnline: this.isOnline,
      stats: this.stats,
      isPerformer: false,
      country: this.country,
      infoPerformer: this.infoPerformer,
      setTypeCommissionAgency: this.setTypeCommissionAgency,
      isBlocked: this.isBlocked,
      commissionExternalAgency: this.commissionExternalAgency,
      verifiedAccount: this.verifiedAccount,
      twitterConnected: this.twitterConnected,
      googleConnected: this.googleConnected,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    const privateInfo = {
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      status: this.status,
      gender: this.gender,
      balance: this.balance,
      roles: this.roles,
      verifiedEmail: this.verifiedEmail
    };

    if (isAdmin) {
      return {
        ...publicInfo,
        ...privateInfo
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
}
