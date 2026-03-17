import { Inject, Injectable, Logger } from '@nestjs/common';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { BookingStreamService } from 'src/modules/booking-stream/services';
import { ConversationService } from 'src/modules/message/services';
import { Model } from 'mongoose';
import { APPROVE_BOOKING_PRIVATE_STREAM_CHANNEL, PURCHASE_ITEM_TYPE, TOKEN_TRANSACTION_SUCCESS_CHANNEL } from 'src/modules/token-transaction/constants';
import { EVENT } from 'src/kernel/constants';
import { StreamModel } from '../models';
import { STREAM_MODEL_PROVIDER } from '../providers/stream.provider';
import { BOOKING_CHAT, PRIVATE_CHAT } from '../constant';
import { StreamDto } from '../dtos';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';

@Injectable()
export class BookingStreamListener {
  private logger = new Logger(BookingStreamListener.name);

  constructor(
    private readonly queueEventService: QueueEventService,
    private readonly bookingStreamService: BookingStreamService,
    private readonly conversationService: ConversationService,
    @Inject(STREAM_MODEL_PROVIDER)
    private readonly streamModel: Model<StreamModel>
  ) {
    this.queueEventService.subscribe(
      APPROVE_BOOKING_PRIVATE_STREAM_CHANNEL,
      'BOOKING_STREAM_APPROVED',
      this.subscriber.bind(this)
    );
  }

  async subscriber(event: QueueEvent) {
    try {
      const { eventName, data } = event;
      if (
        eventName !== EVENT.CREATED
      ) {
        return;
      }

      const bookingAppointment = await this.bookingStreamService.findById(
        data?._id
      );
      if (!bookingAppointment) return;

      const { performerId, userId } = bookingAppointment;

      const stream = await this.streamModel.create({
        sessionId: uuidv4(),
        performerId,
        type: PRIVATE_CHAT,
        isStreaming: true,
        includeIds: [userId],
        waiting: false
      });
      const recipients = [
        { source: 'performer', sourceId: new ObjectId(performerId) },
        { source: 'user', sourceId: userId }
      ];
      const conversation = await this.conversationService.createStreamConversation(
        new StreamDto(stream),
        recipients
      );

      bookingAppointment.conversationId = conversation._id;
      await bookingAppointment.save();
    } catch (e) {
      this.logger.error(e);
    }
  }
}
