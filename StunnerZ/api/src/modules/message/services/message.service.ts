/* eslint-disable no-param-reassign */
import {
  Injectable, Inject, ForbiddenException, HttpException, forwardRef
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { QueueEventService, EntityNotFoundException } from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { FileDto } from 'src/modules/file';
import { FileService } from 'src/modules/file/services';
import { REF_TYPE } from 'src/modules/file/constants';
import { PerformerService } from 'src/modules/performer/services';
import { UserService } from 'src/modules/user/services';
import { PerformerDto } from 'src/modules/performer/dtos';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { TokenTransactionService } from 'src/modules/token-transaction/services';
import { SUBSCRIPTION_STATUS } from 'src/modules/subscription/constants';
import { PURCHASE_ITEM_STATUS } from 'src/modules/token-transaction/constants';
import {
  MessageModel, IRecipient
} from '../models';
import { MESSAGE_MODEL_PROVIDER } from '../providers/message.provider';
import { MessageCreatePayload } from '../payloads/message-create.payload';
import {
  MESSAGE_CHANNEL, MESSAGE_EVENT, MESSAGE_PRIVATE_STREAM_CHANNEL, MESSAGE_TYPE
} from '../constants';
import { MessageDto } from '../dtos';
import { ConversationService } from './conversation.service';
import { MessageListRequest } from '../payloads/message-list.payload';
import { MassMessagePayload } from '../payloads/mass-message.payload';

@Injectable()
export class MessageService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => ConversationService))
    private readonly conversationService: ConversationService,
    @Inject(MESSAGE_MODEL_PROVIDER)
    private readonly messageModel: Model<MessageModel>,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(forwardRef(() => TokenTransactionService))
    private readonly tokenTransactionService: TokenTransactionService,
    private readonly queueEventService: QueueEventService,
    private readonly fileService: FileService
  ) { }

  public async findById(messageId: string | ObjectId) {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new EntityNotFoundException();
    }
    return new MessageDto(message);
  }

  public async updatePaidMessage(messageId: string | ObjectId, isPaid: boolean) {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new EntityNotFoundException();
    }

    message.isPaid = isPaid;
    await message.save();
    return new MessageDto(message);
  }

  public async createPrivateMessage(
    conversationId: string | ObjectId,
    payload: MessageCreatePayload,
    sender: IRecipient
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );

    if (!conversation) {
      throw new EntityNotFoundException();
    }
    const found = conversation.recipients.find(
      (recipient) => recipient.sourceId.toString() === sender.sourceId.toString()
    );
    if (!found) {
      throw new EntityNotFoundException();
    }
    const user = conversation.recipients.find((recipient) => recipient.source.toString() === 'user');
    const performer = conversation.recipients.find((recipient) => recipient.source.toString() === 'performer');

    // const subscription = (await this.subscriptionService.findOneSubscription({
    //   performerId: performer.sourceId,
    //   userId: user.sourceId
    // }));

    // if (!subscription || subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
    //   throw new HttpException('The subscription is deactivated, you can\'t send this message!', 404);
    // }

    const message = await this.messageModel.create({
      ...payload,
      senderId: sender.sourceId,
      senderSource: sender.source,
      conversationId: conversation._id
    });
    const dto = new MessageDto(message);
    await this.queueEventService.publish({
      channel: MESSAGE_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
    return dto;
  }

  public async createPrivatePaidContent(
    file: FileDto,
    conversationId: string | ObjectId,
    payload: MessageCreatePayload,
    sender: IRecipient
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );

    if (!conversation) {
      throw new EntityNotFoundException();
    }

    if (!file) throw new HttpException('File is valid!', 400);
    if (!file.isImage() && !file.isVideo()) {
      await this.fileService.removeIfNotHaveRef(file._id);
      throw new HttpException('Invalid file! Only allow image or video file!', 400);
    }

    const found = conversation.recipients.find(
      (recipient) => recipient.sourceId.toString() === sender.sourceId.toString()
    );
    if (!found) {
      throw new EntityNotFoundException();
    }
    const user = conversation.recipients.find((recipient) => recipient.source.toString() === 'user');
    const performer = conversation.recipients.find((recipient) => recipient.source.toString() === 'performer');

    // const subscription = (await this.subscriptionService.findOneSubscription({
    //   performerId: performer.sourceId,
    //   userId: user.sourceId
    // }));

    // if (!subscription || subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
    //   throw new HttpException('The subscription is deactivated, you can\'t send this message!', 404);
    // }

    const message = await this.messageModel.create({
      ...payload,
      type: MESSAGE_TYPE.PAID_CONTENT,
      senderId: sender.sourceId,
      senderSource: sender.source,
      conversationId: conversation._id,
      fileId: file._id,
      fileType: file.isImage() ? 'photo' : 'video'
    });
    await this.fileService.addRef(file._id, {
      itemType: REF_TYPE.MESSAGE,
      itemId: message._id
    });
    const dto = new MessageDto(message);
    dto.fileUrl = file.getUrl(!!(message.fileType === 'video'));//  todo - view with model only or public if it's video
    dto.thumbnailUrls = file.getThumbnails();
    await this.queueEventService.publish({
      channel: MESSAGE_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
    return {
      ...dto,
      fileUrl: file.getUrl(true)
    };
  }

  public async createPrivateFreeContent(
    file: FileDto,
    conversationId: string | ObjectId,
    payload: MessageCreatePayload,
    sender: IRecipient
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );

    if (!conversation) {
      throw new EntityNotFoundException();
    }

    if (!file) throw new HttpException('File is valid!', 400);
    if (!file.isImage() && !file.isVideo()) {
      await this.fileService.removeIfNotHaveRef(file._id);
      throw new HttpException('Invalid file! Only allow image or video file!', 400);
    }

    const found = conversation.recipients.find(
      (recipient) => recipient.sourceId.toString() === sender.sourceId.toString()
    );
    if (!found) {
      throw new EntityNotFoundException();
    }
    const user = conversation.recipients.find((recipient) => recipient.source.toString() === 'user');
    const performer = conversation.recipients.find((recipient) => recipient.source.toString() === 'performer');

    // const subscription = (await this.subscriptionService.findOneSubscription({
    //   performerId: performer.sourceId,
    //   userId: user.sourceId
    // }));

    // if (!subscription || subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
    //   throw new HttpException('The subscription is deactivated, you can\'t send this message!', 404);
    // }

    const message = await this.messageModel.create({
      ...payload,
      type: MESSAGE_TYPE.FREE_CONTENT,
      senderId: sender.sourceId,
      senderSource: sender.source,
      conversationId: conversation._id,
      fileId: file._id,
      fileType: file.isImage() ? 'photo' : 'video'
    });
    await this.fileService.addRef(file._id, {
      itemType: REF_TYPE.MESSAGE,
      itemId: message._id
    });

    const dto = new MessageDto(message);
    dto.fileUrl = file.getUrl();
    dto.thumbnailUrls = file.getThumbnails();
    await this.queueEventService.publish({
      channel: MESSAGE_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
    return {
      ...dto,
      fileUrl: file.getUrl(true)
    };
  }

  public async createPrivateFileMessage(
    sender: IRecipient,
    recipient: IRecipient,
    file: FileDto,
    payload: MessageCreatePayload
  ): Promise<MessageDto> {
    const conversation = await this.conversationService.createPrivateConversation(
      sender,
      recipient
    );
    if (!file) throw new HttpException('File is valid!', 400);
    if (!file.isImage()) {
      await this.fileService.removeIfNotHaveRef(file._id);
      throw new HttpException('Invalid image!', 400);
    }
    const message = await this.messageModel.create({
      ...payload,
      type: MESSAGE_TYPE.PHOTO,
      senderId: sender.sourceId,
      fileId: file._id,
      senderSource: sender.source,
      conversationId: conversation._id
    });
    await message.save();
    await this.fileService.addRef(file._id, {
      itemType: REF_TYPE.MESSAGE,
      itemId: message._id
    });

    const dto = new MessageDto(message);
    dto.imageUrl = file.getUrl();
    await this.queueEventService.publish({
      channel: MESSAGE_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
    return dto;
  }

  public async loadMessages(req: MessageListRequest, user: UserDto) {
    const conversation = await this.conversationService.findById(
      req.conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    const found = conversation.recipients.find(
      (recipient) => recipient.sourceId.toString() === user._id.toString()
    );
    if (!found) {
      throw new EntityNotFoundException();
    }

    const query = { conversationId: conversation._id };
    const [data, total] = await Promise.all([
      this.messageModel
        .find(query)
        .sort({ createdAt: -1 })
        .lean()
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.messageModel.countDocuments(query)
    ]);

    const fileIds = data.map((d) => d.fileId);
    const files = await this.fileService.findByIds(fileIds);
    const messages = data.map((m) => new MessageDto(m));
    messages.forEach((message) => {
      if (message.fileId) {
        const file = files.find((f) => f._id.toString() === message.fileId.toString());
        if (!file) {
          message.imageUrl = null;
          message.fileUrl = null;
          message.thumbnailUrls = null;
        }
        if (message.type !== MESSAGE_TYPE.PAID_CONTENT) {
          message.imageUrl = file ? file.getUrl() : null;
          message.fileUrl = null;
          message.thumbnailUrls = null;
        }
        if (message.type === MESSAGE_TYPE.MASS_MESSAGE) {
          message.imageUrl = null;
          message.fileUrl = file ? file.getUrl() : null;
          message.thumbnailUrls = null;
        }
        if (message.type === MESSAGE_TYPE.WELCOME_MESSAGE) {
          message.imageUrl = null;
          message.fileUrl = file ? file.getUrl() : null;
          message.thumbnailUrls = null;
        }
        if (message.type === MESSAGE_TYPE.FREE_CONTENT) {
          message.imageUrl = null;
          message.fileUrl = file ? file.getUrl() : null;
          message.thumbnailUrls = null;
        }
        if (message.type === MESSAGE_TYPE.PAID_CONTENT) {
          // paid content file when purchased or sender
          message.fileUrl = file?.getUrl(message.isPaid || message.senderId.toString() === user._id.toString() || message.fileType === 'video');
          message.thumbnailUrls = file?.getThumbnails() || null;
          message.imageUrl = null;
        }
      }
    });

    return {
      data: messages,
      total
    };
  }

  public async deleteMessage(messageId: string, user: UserDto) {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new EntityNotFoundException();
    }
    if (
      user.roles
      && !user.roles.includes('admin')
      && message.senderId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException();
    }
    await message.remove();
    message.fileId && await this.fileService.remove(message.fileId);
    if (message.conversationId) {
      const conversation = await this.conversationService.findById(message.conversationId);
      await this.queueEventService.publish({
        channel: MESSAGE_PRIVATE_STREAM_CHANNEL,
        eventName: MESSAGE_EVENT.DELETED,
        data: { message, conversation }
      });
    }
    return message;
  }

  // stream message
  public async loadPublicMessages(req: MessageListRequest) {
    const conversation = await this.conversationService.findById(
      req.conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    const query = { conversationId: conversation._id };
    const [data, total] = await Promise.all([
      this.messageModel
        .find(query)
        .sort({ createdAt: -1 })
        .lean()
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.messageModel.countDocuments(query)
    ]);

    const senderIds = data.map((d) => d.senderId);
    const [users, performers] = await Promise.all([
      senderIds.length ? this.userService.findByIds(senderIds) : [],
      senderIds.length ? this.performerService.findByIds(senderIds) : []
    ]);

    const messages = data.map((message) => {
      let user = null;
      user = users.find((u) => u._id.toString() === message.senderId.toString());
      if (!user) {
        user = performers.find(
          (p) => p._id.toString() === message.senderId.toString()
        );
      }

      return {
        ...message,
        senderInfo: user ? new UserDto(user).toResponse() : new PerformerDto(user).toResponse()
      };
    });

    return {
      data: messages.map((m) => new MessageDto(m)),
      total
    };
  }

  public async createStreamMessageFromConversation(
    conversationId: string,
    payload: MessageCreatePayload,
    sender: IRecipient,
    user: UserDto
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }
    const message = await this.messageModel.create({
      ...payload,
      senderId: sender.sourceId,
      senderSource: sender.source,
      conversationId: conversation._id
    });
    const dto = new MessageDto(message);
    dto.senderInfo = user;
    await this.queueEventService.publish({
      channel: MESSAGE_PRIVATE_STREAM_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: { message: dto, conversation }
    });
    return dto;
  }

  public async deleteAllMessageInConversation(
    conversationId: string,
    user: any
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }
    if (
      conversation.performerId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException();
    }

    await this.messageModel.deleteMany({ conversationId: conversation._id });
    return { success: true };
  }

  public async loadMessageDetail(messageId: string | ObjectId, user: UserDto) {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new EntityNotFoundException();
    }

    if (message?.type !== MESSAGE_TYPE.PAID_CONTENT || !message.fileId) {
      throw new HttpException('Message is wrong data!', 400);
    }

    const transaction = await this.tokenTransactionService.findOne({
      sourceId: user._id,
      targetId: message._id,
      status: PURCHASE_ITEM_STATUS.SUCCESS
    });

    if (!message?.isPaid || !transaction) {
      throw new HttpException('Message was not paid!', 400);
    }

    const dto = new MessageDto(message);

    const file = await this.fileService.findById(dto.fileId);

    dto.fileUrl = file?.getUrl(true) || null;
    dto.thumbnailUrls = file?.getThumbnails() || null;
    dto.imageUrl = null;
    return dto;
  }

  public async createMassMessage(
    file: FileDto,
    sender: IRecipient,
    payload: MessageCreatePayload,
    conversationId: string | ObjectId
  ) {
    const message = await this.messageModel.create({
      ...payload,
      type: MESSAGE_TYPE.MASS_MESSAGE,
      senderId: sender.sourceId,
      senderSource: sender.source,
      conversationId,
      fileId: file?._id || null,
      fileType: (file?.isImage() ? 'photo' : 'video') || null
    });
    if (file) {
      await this.fileService.addRef(file?._id, {
        itemType: REF_TYPE.MESSAGE,
        itemId: message._id
      });
    }

    const dto = new MessageDto(message);
    dto.fileUrl = file?.getUrl(true) || null;
    await this.queueEventService.publish({
      channel: MESSAGE_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
    return dto;
  }

  public async sendMessagesOneByOne(file: FileDto, payload: any, ids: any, source: any) {
    await ids.reduce(async (lp, id) => {
      await lp;
      try {
        const admin = await this.userService.findOne({ roles: 'admin' });
        const sender = { source: 'admin', sourceId: admin._id } as any;
        const recipient = { source, sourceId: id } as any;
        const newPayload = {
          text: payload.text
        } as MessageCreatePayload;
        const noreply = true;
        const conversation = await this.conversationService.createPrivateConversation(
          sender,
          recipient,
          noreply
        );
        const conversationId = conversation._id;
        return this.createMassMessage(
          file,
          sender,
          newPayload,
          conversationId
        );
      } catch (e) {
        return Promise.resolve();
      }
    }, Promise.resolve());
  }

  public async create(payload: MassMessagePayload) {
    const data = {} as any;
    if (payload.fileId) {
      const detail = await this.fileService.findById(payload?.fileId);
      if (!detail) throw new HttpException('File is valid!', 400);
      if (!detail.isImage() && !detail.isVideo()) {
        await this.fileService.removeIfNotHaveRef(detail._id);
        throw new HttpException('Invalid file! Only allow image or video file!', 400);
      }
      data.file = detail;
    }

    const userIds = [] as any;
    const users = await this.userService.find({ roles: 'user' });
    users.forEach((u) => { userIds.push(u._id); });
    const performerIds = [] as any;
    const performers = await this.performerService.find({});
    performers.forEach((u) => { performerIds.push(u._id); });
    const all = userIds.concat(performerIds);
    const { file } = data;
    if (payload.recipients === 'user' && userIds && userIds.length) {
      this.sendMessagesOneByOne(file, payload, userIds, 'user');
    }
    if (payload.recipients === 'performer' && performerIds && performerIds.length) {
      this.sendMessagesOneByOne(file, payload, performerIds, 'performer');
    }
    if (payload.recipients === 'all' && all && all.length) {
      this.sendMessagesOneByOne(file, payload, userIds, 'user');
      this.sendMessagesOneByOne(file, payload, performerIds, 'performer');
    }
    return true;
  }

  public async deleteMassMessageFile(fileId: string) {
    const file = await this.fileService.findById(fileId);
    if (!file) {
      return false;
    }
    await this.fileService.remove(file._id);
    return true;
  }
}
