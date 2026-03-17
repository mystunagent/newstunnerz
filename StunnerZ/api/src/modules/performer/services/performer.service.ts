/* eslint-disable no-useless-catch */
import {
  Injectable,
  Inject,
  forwardRef,
  HttpException
} from '@nestjs/common';
import { Model } from 'mongoose';
import {
  EntityNotFoundException, ForbiddenException, QueueEventService, QueueEvent, StringHelper
} from 'src/kernel';
import { ObjectId } from 'mongodb';
import { FileService, FILE_EVENT } from 'src/modules/file/services';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { ReactionService } from 'src/modules/reaction/services/reaction.service';
import { FileDto } from 'src/modules/file';
import { AuthService } from 'src/modules/auth/services';
import { EVENT, STATUS } from 'src/kernel/constants';
import { REACTION_TYPE, REACTION } from 'src/modules/reaction/constants';
import { REF_TYPE } from 'src/modules/file/constants';
import {
  PERFORMER_UPDATE_STATUS_CHANNEL,
  PERFORMER_UPDATE_GENDER_CHANNEL,
  DELETE_PERFORMER_CHANNEL,
  ACCOUNT_MANAGER
} from 'src/modules/performer/constants';
import { MailerService } from 'src/modules/mailer';
import { UserDto } from 'src/modules/user/dtos';
import { UserService } from 'src/modules/user/services';
import { ChangeTokenLogService } from 'src/modules/change-token-logs/services/change-token-log.service';
import { CHANGE_TOKEN_LOG_SOURCES } from 'src/modules/change-token-logs/constant';
import { PerformerBlockService } from 'src/modules/block/services';
import { isObjectId, toObjectId, randomString } from 'src/kernel/helpers/string.helper';
import { Storage } from 'src/modules/storage/contants';
// import { BitsafeService } from 'src/modules/payment/services';
import { FollowService } from 'src/modules/follow/services/follow.service';
import * as moment from 'moment';
import { omit } from 'lodash';

import { REFERRAL_MODEL_PROVIDER } from 'src/modules/referral/referral.constant';
import { ReferralModel } from 'src/modules/referral/referral.model';
import { SubPerformerService } from 'src/modules/user/services/sub-performer.service';
import { PerformerDto } from '../dtos';
import {
  UsernameExistedException, EmailExistedException
} from '../exceptions';
import {
  PerformerModel,
  PaymentGatewaySettingModel,
  BankingModel
} from '../models';
import {
  PerformerCreatePayload,
  PerformerUpdatePayload,
  // PerformerRegisterPayload,
  SelfUpdatePayload,
  PaymentGatewaySettingPayload,
  CommissionSettingPayload,
  BankingSettingPayload
} from '../payloads';
import {
  PERFORMER_BANKING_SETTING_MODEL_PROVIDER,
  PERFORMER_MODEL_PROVIDER,
  PERFORMER_PAYMENT_GATEWAY_SETTING_MODEL_PROVIDER
} from '../providers';
import { ROLE_SUB_PERFORMER } from 'src/modules/user/constants';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { BREAST_SIZE, BUTTS, ETHNICITIES, HAIRS } from 'src/modules/utils/constants';

@Injectable()
export class PerformerService {
  constructor(
    // @Inject(forwardRef(() => BitsafeService))
    // private readonly bitsafeService: BitsafeService,
    @Inject(forwardRef(() => FollowService))
    private readonly followService: FollowService,
    @Inject(forwardRef(() => PerformerBlockService))
    private readonly performerBlockService: PerformerBlockService,
    @Inject(forwardRef(() => ChangeTokenLogService))
    private readonly changeTokenLogService: ChangeTokenLogService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => ReactionService))
    private readonly reactionService: ReactionService,
    @Inject(forwardRef(() => SettingService))
    private readonly settingService: SettingService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(forwardRef(() => SocketUserService))
    private readonly socketUserService: SocketUserService,
    @Inject(PERFORMER_MODEL_PROVIDER)
    private readonly performerModel: Model<PerformerModel>,
    private readonly queueEventService: QueueEventService,
    private readonly mailService: MailerService,
    @Inject(PERFORMER_PAYMENT_GATEWAY_SETTING_MODEL_PROVIDER)
    private readonly paymentGatewaySettingModel: Model<PaymentGatewaySettingModel>,
    @Inject(PERFORMER_BANKING_SETTING_MODEL_PROVIDER)
    private readonly bankingSettingModel: Model<BankingModel>,
    @Inject(REFERRAL_MODEL_PROVIDER)
    private readonly referralModel: Model<ReferralModel>,
    @Inject(forwardRef(() => SubPerformerService))
    private readonly subPerformerService: SubPerformerService
  ) {
    this.queueEventService.subscribe(
      'CONVERT_WELCOME_VIDEO_CHANNEL',
      'FILE_PROCESSED_TOPIC',
      this.handleWelcomeVideoFile.bind(this)
    );
  }

  public async handleWelcomeVideoFile(event: QueueEvent) {
    const { eventName } = event;
    if (eventName !== FILE_EVENT.VIDEO_PROCESSED) {
      return;
    }
    const { performerId } = event.data.meta;
    const [performer, file] = await Promise.all([
      this.performerModel.findById(performerId),
      this.fileService.findById(event.data.fileId)
    ]);
    if (!performer) {
      // TODO - delete file?
      await this.fileService.remove(event.data.fileId);
      return;
    }

    performer.welcomeVideoPath = file.getUrl();
    await performer.save();
  }

  public async checkExistedEmailorUsername(payload) {
    const data = payload.username ? await this.performerModel.countDocuments({ username: payload.username.trim().toLowerCase() })
      : await this.performerModel.countDocuments({ email: payload.email.toLowerCase() });
    return data;
  }

  public async findById(
    id: string | ObjectId
  ): Promise<PerformerDto> {
    const model = await this.performerModel.findById(id);
    if (!model) return null;
    return new PerformerDto(model);
  }

  public async findOne(query) {
    const data = await this.performerModel.findOne(query);
    return data;
  }

  public async find(query) {
    const data = await this.performerModel.find(query);
    return data;
  }

  public async updateOne(query: any, params: any, options: any): Promise<any> {
    return this.performerModel.updateOne(query, params, options);
  }

  public async findByUsername(
    username: string,
    user?: UserDto
  ): Promise<PerformerDto> {
    const query = !isObjectId(username) ? {
      username: username.trim()
    } : { _id: username };
    const model = await this.performerModel.findOne(query).lean();
    if (!model) throw new EntityNotFoundException();
    const dto = new PerformerDto(model);
    let isBookMarked = null;
    let isSubscribed = null;
    let isFollowed = null;
    if (user) {
      isBookMarked = await this.reactionService.findOneQuery({
        objectType: REACTION_TYPE.PERFORMER, objectId: model._id, createdBy: user._id, action: REACTION.BOOK_MARK
      });
      const [subscription, following] = await Promise.all([
        this.subscriptionService.findOneSubscription({
          performerId: model._id,
          userId: user._id
        }),
        this.followService.findOne({ followerId: user._id, followingId: model._id })
      ]);
      if (subscription) {
        isSubscribed = moment().isBefore(subscription.expiredAt);
        if (subscription.usedTrialSubscription) {
          dto.isTrialSubscription = false;
        }
      }
      isFollowed = following;
      isSubscribed = (subscription && moment().isBefore(moment(subscription.expiredAt))) || false;
    }
    dto.isSubscribed = !!isSubscribed;
    dto.isBookMarked = !!isBookMarked;
    dto.isFollowed = !!isFollowed;
    if (user && user.roles && user.roles.includes('admin')) {
      dto.isSubscribed = true;
    }
    if (model.welcomeVideoId) {
      const welcomeVideo = await this.fileService.findById(
        model.welcomeVideoId
      );
      dto.welcomeVideoPath = welcomeVideo ? welcomeVideo.getUrl() : '';
      dto.welcomeVideoPath && await this.performerModel.updateOne({ _id: model._id }, { welcomeVideoPath: dto.welcomeVideoPath });
    }
    await this.increaseViewStats(dto._id);
    return dto;
  }

  public async checkBlockedByPerformer(
    username: string,
    user?: UserDto
  ): Promise<any> {
    const query = !isObjectId(username) ? {
      username: username.trim()
    } : { _id: username };
    const model = await this.performerModel.findOne(query).lean();
    if (!model) throw new EntityNotFoundException();
    let isBlockedByPerformer = false;
    if (user) {
      const isBlocked = `${user?._id}` !== `${model._id}` && await this.performerBlockService.checkBlockedByPerformer(
        model._id,
        user._id
      );
      isBlockedByPerformer = isBlocked;
    }
    const data = {
      isBlockedByPerformer
    };
    return data;
  }

  public async checkBlockCountry(
    username: string,
    countryCode?: string,
    user?: UserDto
  ): Promise<any> {
    const query = !isObjectId(username) ? {
      username: username.trim()
    } : { _id: username };
    const model = await this.performerModel.findOne(query).lean();
    if (!model) throw new EntityNotFoundException();
    let isBlockedCountry = false;
    if (countryCode && `${user?._id}` !== `${model._id}`) {
      const isBlocked = await this.performerBlockService.checkBlockedCountryByIp(model._id, countryCode);
      isBlockedCountry = isBlocked;
    }
    const data = {
      isBlockedCountry
    };
    return data;
  }

  public async findByEmail(email: string): Promise<PerformerDto> {
    if (!email) {
      return null;
    }
    const model = await this.performerModel.findOne({
      email: email.toLowerCase()
    });
    if (!model) return null;
    return new PerformerDto(model);
  }

  public async findByIds(ids: any[]): Promise<PerformerDto[]> {
    const performers = await this.performerModel
      .find({
        _id: {
          $in: ids
        }
      })
      .lean()
      .exec();
    return performers.map((p) => new PerformerDto(p));
  }

  public async getDetails(id: string, jwToken: string): Promise<PerformerDto> {
    const performer = await this.performerModel.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }
    const [
      documentVerification, idVerification, welcomeVideo
    ] = await Promise.all([
      performer.documentVerificationId && this.fileService.findById(performer.documentVerificationId),
      performer.idVerificationId && this.fileService.findById(performer.idVerificationId),
      performer.welcomeVideoId && this.fileService.findById(performer.welcomeVideoId)
    ]);
    const [
      // paypalSetting,
      blockCountries, bankingInformation
    ] = await Promise.all([
      // this.paymentGatewaySettingModel.findOne({ performerId: id, key: 'paypal' }),
      this.performerBlockService.findOneBlockCountriesByQuery({ sourceId: id }),
      this.getBankInfo(performer._id)
    ]);
    const dto = new PerformerDto(performer);
    dto.avatar = dto.avatarPath ? FileDto.getPublicUrl(dto.avatarPath) : null; // TODO - get default avatar
    dto.cover = dto.coverPath ? FileDto.getPublicUrl(dto.coverPath) : null;
    dto.welcomeVideoName = welcomeVideo ? welcomeVideo.name : null;
    dto.welcomeVideoPath = welcomeVideo ? welcomeVideo.getUrl() : null;
    if (idVerification) {
      let fileUrl = idVerification.getUrl(true);
      if (idVerification.server !== Storage.S3) {
        fileUrl = `${fileUrl}?documentId=${idVerification._id}&token=${jwToken}`;
      }
      dto.idVerification = {
        _id: idVerification._id,
        url: fileUrl,
        mimeType: idVerification.mimeType
      };
    }
    if (documentVerification) {
      let fileUrl = documentVerification.getUrl(true);
      if (documentVerification.server !== Storage.S3) {
        fileUrl = `${fileUrl}?documentId=${documentVerification._id}&token=${jwToken}`;
      }
      dto.documentVerification = {
        _id: documentVerification._id,
        url: fileUrl,
        mimeType: documentVerification.mimeType
      };
    }
    const user = await this.userService.findById(id);
    if (user) {
      if (user.roles.includes('sub_performer')) {
        const bank = await this.getBankInfo(user._id);
        const getPrivilege = await this.subPerformerService.getMyPrivileges(user._id);
        dto.infoSubPerformer = {
          ...new UserDto(user).toResponse(true),
          privilege: getPrivilege
        };
        dto.infoBankSubPerformer = bank;
      }
    }
    if (performer) {
      const per = await this.userService.findOne({ mainSourceId: performer._id.toString(), status: 'active', usingSubAccount: true });
      if (per) {
        dto.nameSubPerformer = {
          name: per.name,
          username: per.username
        };
      }
    }
    // dto.paypalSetting = paypalSetting;
    dto.blockCountries = blockCountries;
    dto.bankingInformation = bankingInformation;
    return dto;
  }

  public async delete(id: string) {
    if (!StringHelper.isObjectId(id)) throw new ForbiddenException();
    const performer = await this.performerModel.findById(id);
    if (!performer) throw new EntityNotFoundException();
    await this.referralModel.deleteOne({ registerSource: 'performer', registerId: performer._id });
    await this.performerModel.deleteOne({ _id: id });
    await this.queueEventService.publish(new QueueEvent({
      channel: DELETE_PERFORMER_CHANNEL,
      eventName: EVENT.DELETED,
      data: new PerformerDto(performer).toResponse()
    }));
    return { deleted: true };
  }

  public async create(
    payload: PerformerCreatePayload,
    user?: UserDto
  ): Promise<PerformerDto> {
    const data = omit({
      ...payload,
      updatedAt: new Date(),
      createdAt: new Date()
    }, ['balance', 'commissionPercentage']) as any;
    if (!data.name) {
      // eslint-disable-next-line no-param-reassign
      data.name = [data.firstName || '', data.lastName || ''].join(' ');
    }
    if (!data.username) {
      // eslint-disable-next-line no-param-reassign
      data.username = `user${randomString(8, '0123456789')}`;
    }
    const countPerformerUsername = await this.performerModel.countDocuments({
      username: payload.username.trim().toLowerCase()
    });
    const countUserUsername = await this.userService.checkExistedEmailorUsername({ username: payload.username });
    if (countPerformerUsername || countUserUsername) {
      throw new UsernameExistedException();
    }

    const countPerformerEmail = await this.performerModel.countDocuments({
      email: payload.email.toLowerCase()
    });
    const countUserEmail = await this.userService.checkExistedEmailorUsername({ email: payload.email });
    if (countPerformerEmail || countUserEmail) {
      throw new EmailExistedException();
    }

    if (payload.avatarId) {
      const avatar = await this.fileService.findById(payload.avatarId);
      if (!avatar) {
        throw new EntityNotFoundException('Avatar not found!');
      }
      // TODO - check for other storaged
      data.avatarPath = avatar.path;
    }

    if (payload.coverId) {
      const cover = await this.fileService.findById(payload.coverId);
      if (!cover) {
        throw new EntityNotFoundException('Cover not found!');
      }
      // TODO - check for other storaged
      data.coverPath = cover.path;
    }

    if (data.verifiedAccount && !data.completedAccount) {
      throw new HttpException('Account not completed, the model must be completed the account can be verified', 403);
    }

    // TODO - check for category Id, agent
    if (user) {
      data.createdBy = user._id;
    }
    data.username = data.username ? data.username.trim().toLowerCase() : `model${randomString(8, '0123456789')}`;
    data.email = data.email.toLowerCase();
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    if (!data.name) {
      data.name = data.firstName && data.lastName ? [data.firstName, data.lastName].join(' ') : 'No_display_name';
    }
    const performer = await this.performerModel.create(data);

    await Promise.all([
      payload.idVerificationId
      && this.fileService.addRef(payload.idVerificationId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      }),
      payload.documentVerificationId
      && this.fileService.addRef(payload.documentVerificationId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      }),
      payload.avatarId
      && this.fileService.addRef(payload.avatarId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      })
    ]);

    // TODO - fire event?
    return new PerformerDto(performer);
  }

  public async register(
    payload: any
  ): Promise<PerformerDto> {
    const data = omit({
      ...payload,
      updatedAt: new Date(),
      createdAt: new Date()
    }, ['balance', 'commissionPercentage']) as any;
    if (payload?.username) {
      const countPerformerUsername = await this.performerModel.countDocuments({
        username: payload.username.trim().toLowerCase()
      });
      const countUserUsername = await this.userService.checkExistedEmailorUsername({ username: payload.username });
      if (countPerformerUsername || countUserUsername) {
        throw new UsernameExistedException();
      }
    }
    const countPerformerEmail = await this.performerModel.countDocuments({
      email: payload.email.toLowerCase()
    });
    const countUserEmail = await this.userService.checkExistedEmailorUsername({ email: payload.email });
    if (countPerformerEmail || countUserEmail) {
      throw new EmailExistedException();
    }

    if (payload.avatarId) {
      const avatar = await this.fileService.findById(payload.avatarId);
      if (!avatar) {
        throw new EntityNotFoundException('Avatar not found!');
      }
      // TODO - check for other storaged
      data.avatarPath = avatar.path;
    }
    data.username = data.username ? data.username.trim().toLowerCase() : `model${randomString(8, '0123456789')}`;
    data.email = data.email.toLowerCase();
    if (!data.name) {
      data.name = data.firstName && data.lastName ? [data.firstName, data.lastName].join(' ') : 'No_display_name';
    }
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    const performer = await this.performerModel.create(data);

    await Promise.all([
      payload.avatarId && this.fileService.addRef(payload.avatarId, {
        itemId: performer._id as any,
        itemType: REF_TYPE.PERFORMER
      })
    ]);
    const adminEmail = await SettingService.getValueByKey(SETTING_KEYS.ADMIN_EMAIL);
    adminEmail && await this.mailService.send({
      subject: 'New performer sign up',
      to: adminEmail,
      data: { performer },
      template: 'new-performer-notify-admin'
    });

    // TODO - fire event?
    return new PerformerDto(performer);
  }

  public async adminUpdate(
    id: string,
    payload: PerformerUpdatePayload
  ): Promise<any> {
    const performer = await this.performerModel.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    const data = omit(payload, ['welcomeVideoId', 'welcomeVideoPath', 'avatarId', 'coverId', 'avatarPath', 'coverPath']) as any;
    if (!data.name) {
      data.name = [data.firstName || '', data.lastName || ''].join(' ');
    }

    if (data.email && data.email.toLowerCase() !== performer.email) {
      const emailCheck = await this.performerModel.countDocuments({
        email: data.email.toLowerCase(),
        _id: { $ne: performer._id }
      });
      const countUserEmail = await this.userService.checkExistedEmailorUsername({ email: data.email });
      if (emailCheck || countUserEmail) {
        throw new EmailExistedException();
      }
      data.email = data.email.toLowerCase();
    }

    if (data.username && data.username.trim().toLowerCase() !== performer.username) {
      const usernameCheck = await this.performerModel.countDocuments({
        username: data.username.trim().toLowerCase(),
        _id: { $ne: performer._id }
      });
      const countUserUsername = await this.userService.checkExistedEmailorUsername({ username: data.username });
      if (usernameCheck || countUserUsername) {
        throw new UsernameExistedException();
      }
      data.username = data.username.trim().toLowerCase();
    }

    if (!data.referrerId) {
      data.referrerId = null;
    }

    if (data.verifiedAccount && !data.completedAccount) {
      throw new HttpException('Account not completed, the model must be completed the account can be verified', 403);
    }

    if (
      (payload.avatarId && !performer.avatarId)
      || (performer.avatarId
        && payload.avatarId
        && payload.avatarId !== performer.avatarId.toString())
    ) {
      const avatar = await this.fileService.findById(payload.avatarId);
      if (!avatar) {
        throw new EntityNotFoundException('Avatar not found!');
      }
      // TODO - check for other storaged
      data.avatarPath = avatar.path;
    }

    if (
      (payload.coverId && !performer.coverId)
      || (performer.coverId
        && payload.coverId
        && payload.coverId !== performer.coverId.toString())
    ) {
      const cover = await this.fileService.findById(payload.coverId);
      if (!cover) {
        throw new EntityNotFoundException('Cover not found!');
      }
      // TODO - check for other storaged
      data.coverPath = cover.path;
    }
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    await this.performerModel.updateOne({ _id: id }, data);
    const newPerformer = await this.performerModel.findById(performer._id);
    const oldStatus = performer.status;
    const oldGender = performer.gender;
    const oldBalance = performer.balance;
    // logs change token
    if (oldBalance !== newPerformer.balance) {
      await this.changeTokenLogService.changeTokenLog({
        source: CHANGE_TOKEN_LOG_SOURCES.PERFORMER,
        sourceId: newPerformer._id,
        token: newPerformer.balance - oldBalance
      });
    }
    // fire event that updated performer status
    if (data.status !== performer.status) {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: PERFORMER_UPDATE_STATUS_CHANNEL,
          eventName: EVENT.UPDATED,
          data: {
            ...new PerformerDto(newPerformer),
            oldStatus
          }
        })
      );
    }
    // fire event that updated performer gender
    if (data.gender !== performer.gender) {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: PERFORMER_UPDATE_GENDER_CHANNEL,
          eventName: EVENT.UPDATED,
          data: {
            ...new PerformerDto(newPerformer),
            oldGender
          }
        })
      );
    }
    if (performer.email && performer.email !== newPerformer.email) {
      await this.authService.sendVerificationEmail(newPerformer);
      await this.authService.updateKey({
        source: 'performer',
        sourceId: newPerformer._id,
        type: 'email'
      });
    }
    // update auth key if username or email has changed
    if (performer.username && performer.username.trim() !== newPerformer.username) {
      await this.authService.updateKey({
        source: 'performer',
        sourceId: newPerformer._id,
        type: 'username'
      });
    }
    return true;
  }

  public async selfUpdate(
    id: string,
    payload: SelfUpdatePayload
  ): Promise<boolean> {
    const performer = await this.performerModel.findById(id);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    const data = omit(payload, ['welcomeVideoId', 'welcomeVideoPath', 'avatarId', 'coverId', 'avatarPath', 'coverPath', 'balance', 'commissionPercentage']) as any;
    if (!data.name) {
      data.name = [data.firstName || '', data.lastName || ''].join(' ');
    }
    if (data.username && data.username !== performer.username) {
      const usernameCheck = await this.performerModel.countDocuments({
        username: data.username.trim().toLowerCase(),
        _id: { $ne: performer._id }
      });
      if (usernameCheck) {
        throw new UsernameExistedException();
      }
      data.username = data.username.trim().toLowerCase();
    }
    if (data.email && data.email !== performer.email) {
      const count = await this.performerModel.countDocuments({
        email: data.email.toLowerCase(),
        _id: { $ne: performer._id }
      });
      if (count) {
        throw new EmailExistedException();
      }
      data.email = data.email.toLowerCase();
    }
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    if (!data.referrerId) {
      data.referrerId = null;
    }
    if (data.pricePerMinuteBookStream < 10) {
      throw new HttpException('Please set minium price per minute stream is 10 tokens', 400);
    }

    await this.performerModel.updateOne({ _id: id }, data);
    const newPerformer = await this.performerModel.findById(id);
    const oldGender = performer.gender;
    // fire event that updated performer gender
    if (data.gender !== performer.gender) {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: PERFORMER_UPDATE_GENDER_CHANNEL,
          eventName: EVENT.UPDATED,
          data: {
            ...new PerformerDto(newPerformer),
            oldGender
          }
        })
      );
    }
    if (performer.email && performer.email !== newPerformer.email) {
      await this.authService.sendVerificationEmail(newPerformer);
      await this.authService.updateKey({
        source: 'performer',
        sourceId: newPerformer._id,
        type: 'email'
      });
    }
    // update auth key if username or email has changed
    if (performer.username && performer.username !== newPerformer.username) {
      await this.authService.updateKey({
        source: 'performer',
        sourceId: newPerformer._id,
        type: 'username'
      });
    }

    const bankingInfo = await this.getBankInfo(performer._id);
    if (newPerformer?.verifiedDocument && bankingInfo?._id) {
      await this.updateCompletedAccount(performer?._id);
    }
    return true;
  }

  public async modelCreate(payload): Promise<PerformerModel> {
    const data = omit({
      ...payload,
      updatedAt: new Date(),
      createdAt: new Date()
    }, ['balance', 'commissionPercentage']) as any;
    if (!data.name) {
      // eslint-disable-next-line no-param-reassign
      data.name = [data.firstName || '', data.lastName || ''].join(' ');
    }
    if (!data.username) {
      // eslint-disable-next-line no-param-reassign
      data.username = `model${StringHelper.randomString(8, '0123456789')}`;
    }
    return this.performerModel.create(data);
  }

  public async updateAvatar(performerId: string | ObjectId, file: FileDto) {
    const performer = await this.performerModel.findById(performerId);
    if (!performer) throw new EntityNotFoundException();
    await this.performerModel.updateOne(
      { _id: performerId },
      {
        avatarId: file._id,
        avatarPath: file.path
      }
    );
    await this.fileService.addRef(file._id, {
      itemId: toObjectId(performerId),
      itemType: REF_TYPE.PERFORMER
    });

    if (performer.avatarId && `${performer.avatarId}` !== `${file._id}`) {
      await this.fileService.remove(performer.avatarId);
    }
    const bankingInfo = await this.getBankInfo(performer?._id);
    if (performer?.verifiedDocument && bankingInfo?._id) {
      await this.updateCompletedAccount(performer?._id);
    }

    return file;
  }

  public async updateWelcomeMessage(performerId: string | ObjectId, file: FileDto) {
    const performer = await this.performerModel.findById(performerId);
    if (!performer) throw new EntityNotFoundException();
    await this.performerModel.updateOne(
      { _id: performerId },
      {
        welcomeMessageFileId: file._id,
        welcomeMessagePath: file.path,
        welcomeMessageFileType: file?.isImage() ? 'photo' : 'video'
      }
    );
    await this.fileService.addRef(file._id, {
      itemId: toObjectId(performerId),
      itemType: REF_TYPE.WELCOME_MESSAGE
    });

    if (performer.welcomeMessageFileId && `${performer.welcomeMessageFileId}` !== `${file._id}`) {
      await this.fileService.remove(performer.welcomeMessageFileId);
    }
    return file;
  }

  public async updateCover(performerId: string | ObjectId, file: FileDto) {
    const performer = await this.performerModel.findById(performerId);
    if (!performer) throw new EntityNotFoundException();
    await this.performerModel.updateOne(
      { _id: performerId },
      {
        coverId: file._id,
        coverPath: file.path
      }
    );
    await this.fileService.addRef(file._id, {
      itemId: toObjectId(performerId),
      itemType: REF_TYPE.PERFORMER
    });
    if (performer.coverId && `${performer.coverId}` !== `${file._id}`) {
      await this.fileService.remove(performer.coverId);
    }
    return file;
  }

  public async updateWelcomeVideo(performerId: string | ObjectId, file: FileDto) {
    const performer = await this.performerModel.findById(performerId);
    if (!performer) throw new EntityNotFoundException();
    await this.performerModel.updateOne(
      { _id: performerId },
      {
        welcomeVideoId: file._id,
        welcomeVideoPath: file.path
      }
    );

    await this.fileService.addRef(file._id, {
      itemId: toObjectId(performerId),
      itemType: REF_TYPE.PERFORMER
    });

    if (performer.welcomeVideoId && `${performer.welcomeVideoId}` !== `${file._id}`) {
      await this.fileService.remove(performer.welcomeVideoId);
    }
    await this.fileService.queueProcessVideo(file._id, {
      publishChannel: 'CONVERT_WELCOME_VIDEO_CHANNEL',
      meta: {
        performerId
      }
    });
    return file;
  }

  public async getBankInfo(performerId: string | ObjectId) {
    const data = await this.bankingSettingModel.findOne({ performerId });
    return data;
  }

  public async increaseViewStats(id: string | ObjectId) {
    return this.performerModel.updateOne(
      { _id: id },
      {
        $inc: { 'stats.views': 1 }
      }
    );
  }

  public async updateLastStreamingTime(
    id: string | ObjectId,
    streamTime: number
  ) {
    return this.performerModel.updateOne(
      { _id: id },
      {
        $set: { lastStreamingTime: new Date(), live: 0, streamingStatus: 'offline' },
        $inc: { 'stats.totalStreamTime': streamTime }
      }
    );
  }

  public async updateStats(
    id: string | ObjectId,
    payload: Record<string, number>
  ) {
    return this.performerModel.updateOne({ _id: id }, { $inc: payload });
  }

  public async goLive(id: string | ObjectId) {
    return this.performerModel.updateOne({ _id: id }, { $set: { live: 1 } });
  }

  public async setStreamingStatus(id: string | ObjectId, streamingStatus: string) {
    return this.performerModel.updateOne({ _id: id }, { $set: { streamingStatus } });
  }

  public async updatePaymentGateway(payload: PaymentGatewaySettingPayload) {
    let item = await this.paymentGatewaySettingModel.findOne({
      key: payload.key,
      performerId: payload.performerId
    });
    if (!item) {
      // eslint-disable-next-line new-cap
      item = new this.paymentGatewaySettingModel();
    }
    item.key = payload.key;
    item.performerId = payload.performerId as any;
    item.status = 'active';
    item.value = payload.value;
    return item.save();
  }

  public async getPaymentSetting(
    performerId: string | ObjectId,
    service = 'ccbill'
  ) {
    return this.paymentGatewaySettingModel.findOne({
      key: service,
      performerId
    });
  }

  public async updateStreamIdForPerformer(performerId: string, streamId: string) {
    await this.performerModel.updateOne(
      { _id: performerId },
      {
        $set: {
          streamId
        }
      }
    );
  }

  public async updateSubscriptionStat(performerId: string | ObjectId, num = 1) {
    const performer = await this.performerModel.findById(performerId);
    if (!performer) return;
    const minimumVerificationNumber = await this.settingService.getKeyValue(SETTING_KEYS.PERFORMER_VERIFY_NUMBER) || 5;
    const verifiedAccount = num === 1 ? performer.stats.subscribers >= (minimumVerificationNumber - 1) : (performer.stats.subscribers - 1) < minimumVerificationNumber;
    await this.performerModel.updateOne(
      { _id: performerId },
      {
        $inc: { 'stats.subscribers': num },
        verifiedAccount
      }
    );
  }

  public async updateLikeStat(performerId: string | ObjectId, num = 1) {
    return this.performerModel.updateOne(
      { _id: performerId },
      {
        $inc: { 'stats.likes': num }
      }
    );
  }

  public async updateCommissionSetting(
    performerId: string,
    payload: CommissionSettingPayload
  ) {
    return this.performerModel.updateOne({ _id: performerId }, {
      commissionPercentage: payload.commissionPercentage
    });
  }

  public async updateBankingSetting(
    performerId: string,
    payload: BankingSettingPayload,
    user?: UserDto
  ) {
    const performer = await this.performerModel.findById(performerId);
    if (!performer) throw new EntityNotFoundException();
    if (user && user?.roles && !user?.roles.includes('admin') && `${user._id}` !== `${performerId}`) {
      throw new HttpException('Permission denied', 403);
    }
    let item = await this.bankingSettingModel.findOne({ performerId });
    if (!item) {
      // eslint-disable-next-line new-cap
      item = new this.bankingSettingModel(payload);
    }
    item.performerId = performerId as any;
    item.type = payload.type;

    // sepa new fields
    item.sepa_beneficiary_name = payload.sepa_beneficiary_name;
    item.sepa_beneficiary_iban = payload.sepa_beneficiary_iban;
    item.sepa_currency = payload.sepa_currency;
    // wire new fields
    item.beneficiary_name = payload.beneficiary_name;
    item.beneficiary_street = payload.beneficiary_street;
    item.beneficiary_city = payload.beneficiary_city;
    item.beneficiary_postal_code = payload.beneficiary_postal_code;
    item.beneficiary_country_code = payload.beneficiary_country_code;
    item.beneficiary_account = payload.beneficiary_account;
    item.bic_code = payload.bic_code;
    item.intermediary_bank_bic_code = payload.intermediary_bank_bic_code;
    item.currency = payload.currency;

    await item.save();
    if (performer?.verifiedDocument) {
      await this.updateCompletedAccount(performer?._id);
    }

    return item;
  }

  public async updateVerificationStatus(
    userId: string | ObjectId
  ): Promise<any> {
    return this.performerModel.updateOne(
      {
        _id: userId
      },
      { status: STATUS.ACTIVE, verifiedEmail: true }
    );
  }

  public async updateCompletedAccount(
    performerId: string | ObjectId
  ): Promise<any> {
    return this.performerModel.updateOne(
      {
        _id: performerId
      },
      { completedAccount: true }
    );
  }

  public async updatePerformerBalance(performerId: string | ObjectId, tokens: number) {
    await this.performerModel.updateOne({ _id: performerId }, { $inc: { balance: tokens } });
  }

  public async checkAuthDocument(req: any, user: UserDto) {
    const { query } = req;
    if (!query.documentId) {
      throw new ForbiddenException();
    }
    if (user.roles && user.roles.indexOf('admin') > -1) {
      return true;
    }
    // check type video
    const file = await this.fileService.findById(query.documentId);
    if (!file || !file.refItems || (file.refItems[0] && file.refItems[0].itemType !== REF_TYPE.PERFORMER)) return false;
    if (file.refItems && file.refItems[0].itemId && user._id.toString() === file.refItems[0].itemId.toString()) {
      return true;
    }
    throw new ForbiddenException();
  }

  public async getPrivileges(id: string | ObjectId) {
    const performer = await this.performerModel.findById(id);
    if (performer) {
      return ['all'];
    }
    return this.subPerformerService.getMyPrivileges(id);
  }

  public async updateManagerAccount(performer: PerformerDto, by: string) {
    const checkBy = Object.values(ACCOUNT_MANAGER).includes(by);
    if (!checkBy) {
      throw new HttpException('Please choose difficult the manager', 403);
    }

    await this.performerModel.updateOne({
      _id: performer._id
    }, {
      accountManager: by.toString()
    });

    const check = await this.userService.findOne({ mainSourceId: performer._id, roles: ROLE_SUB_PERFORMER, usingSubAccount: true });

    if (check) {
      if (by === ACCOUNT_MANAGER.AGENCY_MANAGED) {
        await this.userService.updateOne({ _id: check._id }, { status: 'active' }, {});
      } else {
        await this.userService.updateOne({ _id: check._id }, { status: 'inactive' }, {});
      }
    }

    if (by !== ACCOUNT_MANAGER.SELF_MANAGED) {
      await this.mailService.send({
        subject: 'Change External Agency',
        to: performer.email,
        data: { performer },
        template: 'performer-change-agency'
      });
    }

    return true;
  }

  public async updateBankingForSubPerformer(id: string, payload: BankingSettingPayload) {
    const user = await this.userService.findById(id);
    if (!user || !user.roles.includes('sub_performer')) {
      throw new EntityNotFoundException();
    }

    let item = await this.bankingSettingModel.findOne({ performerId: user._id });

    if (!item) {
      // eslint-disable-next-line new-cap
      item = new this.bankingSettingModel(payload);
    }

    item.performerId = user._id as any;
    item.type = payload.type;

    // sepa new fields
    item.sepa_beneficiary_name = payload.sepa_beneficiary_name;
    item.sepa_beneficiary_iban = payload.sepa_beneficiary_iban;
    item.sepa_currency = payload.sepa_currency;
    // wire new fields
    item.beneficiary_name = payload.beneficiary_name;
    item.beneficiary_street = payload.beneficiary_street;
    item.beneficiary_city = payload.beneficiary_city;
    item.beneficiary_postal_code = payload.beneficiary_postal_code;
    item.beneficiary_country_code = payload.beneficiary_country_code;
    item.beneficiary_account = payload.beneficiary_account;
    item.bic_code = payload.bic_code;
    item.intermediary_bank_bic_code = payload.intermediary_bank_bic_code;
    item.currency = payload.currency;

    await item.save();

    // sub_added_banking
    await this.socketUserService.emitToUsers(user._id, 'sub_added_banking', {
      updated: true
    });

    return item;
  }

  async updatePriceForBooking(id: string, price: number) {
    const data = await this.performerModel.updateOne({ _id: id.toString() }, {
      bookingStreamPrice: price
    });
    return data;
  }

  async getNameSubAccount(performer: any) {
    if (performer) {
      if (performer.accountManager === "stunnerZ-managed") {
        return 'StunnerZ Managed';
      }
      if (performer.accountManager === "agency-managed") {
        const subAccount = await this.userService.findSubAccount(performer._id);
        return subAccount?.name || subAccount?.username;
      }
      return 'Self Managed';
    }
  }

  async clearBasicInfoAllModel() {
    await this.performerModel.updateMany({}, {
      $set: {
        hair: '',
        breastSize: '',
        butt: '',
        ethnicity: ''
      }
    });
    return true;
  }

  async resetAllInfoModelFollowRequired() {
    const performers = await this.performerModel.find().exec();
    for (const performer of performers) {
      const validEthnicity = ETHNICITIES.find(e => e.value === performer.ethnicity);
      performer.ethnicity = validEthnicity ? performer.ethnicity : "";

      const validButt = BUTTS.find(b => b.value === performer.butt);
      performer.butt = validButt ? performer.butt : "";

      const validHair = HAIRS.find(h => h.value === performer.hair);
      performer.hair = validHair ? performer.hair : "";

      const validBreastSize = BREAST_SIZE.find(b => b.value === performer.breastSize);
      performer.breastSize = validBreastSize ? performer.breastSize : "";

      // Lưu performer đã cập nhật
      await performer.save();
    }
  }
}
