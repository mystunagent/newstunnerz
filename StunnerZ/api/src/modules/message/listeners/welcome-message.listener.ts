import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { Model } from 'mongoose';
import { PerformerService } from 'src/modules/performer/services';
import { PerformerDto } from 'src/modules/performer/dtos';
import { FileService } from 'src/modules/file/services';
import { FileDto } from 'src/modules/file';
import {
  MESSAGE_CHANNEL, MESSAGE_EVENT, MESSAGE_TYPE
} from '../constants';
import { MessageDto } from '../dtos';
import { MessageModel } from '../models';
import { MESSAGE_MODEL_PROVIDER } from '../providers';
import { ConversationService } from '../services';

export const SEND_WELCOME_MESSAGE_CHANNEL = 'SEND_WELCOME_MESSAGE_CHANNEL';
const SEND_WELCOME_MESSAGE_TOPIC = 'SEND_WELCOME_MESSAGE_TOPIC';
export const REMOVE_WELCOME_MESSAGE_CHANNEL = 'REMOVE_WELCOME_MESSAGE_CHANNEL';

const templateWelcomeMessage = `Welcome baby thank you for subscribing Here you can see private pics/vids that are not allowed on Social Media and you can chat to me exclusively!! I'll always reply you

Get access to all o my unseen & exclusive X-rated content right here including - my naughtiest wildest fantasises based on all real life stories while exploring my life`;

@Injectable()
export class WelcomeMessageListener {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @Inject(MESSAGE_MODEL_PROVIDER)
    private readonly messageModel: Model<MessageModel>,
    private readonly queueEventService: QueueEventService,
    private readonly conversationService: ConversationService

  ) {
    this.queueEventService.subscribe(
      SEND_WELCOME_MESSAGE_CHANNEL,
      SEND_WELCOME_MESSAGE_TOPIC,
      this.handleSendWelcomeMessage.bind(this)
    );
  }

  private async handleSendWelcomeMessage(event: QueueEvent): Promise<void> {
    if (event.eventName !== MESSAGE_EVENT.CREATED) return;
    const { sender, recipient } = event.data;
    const performer = await this.performerService.findById(sender.sourceId);
    const conversation = await this.conversationService.createPrivateConversation(sender, recipient);
    const file = performer.welcomeMessageFileId && await this.fileService.findById(performer.welcomeMessageFileId);
    const existed = await this.messageModel.findOne({
      type: MESSAGE_TYPE.WELCOME_MESSAGE,
      senderId: sender?.sourceId,
      conversationId: conversation?._id,
      meta: {
        fileUrl: FileDto.getPublicUrl(file?.path) || '/static/thank-you.jpg',
        // eslint-disable-next-line no-nested-ternary
        fileType: file ? (file?.isImage() ? 'photo' : 'video') : 'photo'
      },
      text: performer?.welcomeMessageText || templateWelcomeMessage
    });
    if (existed) return;
    const message = await this.messageModel.create({
      type: MESSAGE_TYPE.WELCOME_MESSAGE,
      fileId: file?._id || null,
      text: performer?.welcomeMessageText || templateWelcomeMessage,
      meta: {
        fileUrl: FileDto.getPublicUrl(file?.path) || '/static/thank-you.jpg',
        // eslint-disable-next-line no-nested-ternary
        fileType: file ? (file?.isImage() ? 'photo' : 'video') : 'photo'
      },
      senderSource: sender?.source,
      senderId: sender?.sourceId,
      conversationId: conversation?._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const dto = new MessageDto(message);
    dto.fileUrl = file && file.getUrl();
    dto.senderInfo = new PerformerDto(performer).toResponse();
    await this.queueEventService.publish({
      channel: MESSAGE_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
  }
}
