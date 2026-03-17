/* eslint-disable no-nested-ternary */
import {
  Injectable, Inject, forwardRef
} from '@nestjs/common';
import {
  EntityNotFoundException
} from 'src/kernel';
import { Model } from 'mongoose';

import { StreamService } from 'src/modules/stream/services';

import { SocketUserService } from 'src/modules/socket/services/socket-user.service';

import { ConversationService } from 'src/modules/message/services';
import { EarningService } from 'src/modules/earning/services/earning.service';
import { EarningModel } from 'src/modules/earning/models/earning.model';
import { EARNING_MODEL_PROVIDER } from 'src/modules/earning/providers/earning.provider';
import { PAYMENT_TOKEN_MODEL_PROVIDER } from '../providers';
import { TokenTransactionModel } from '../models';

@Injectable()
export class TokenTransactionStreamService {
  constructor(
    @Inject(PAYMENT_TOKEN_MODEL_PROVIDER)
    private readonly TokenPaymentModel: Model<TokenTransactionModel>,
    @Inject(EARNING_MODEL_PROVIDER)
    private readonly earningModel: Model<EarningModel>,
    private readonly socketService: SocketUserService,
    @Inject(forwardRef(() => StreamService))
    private readonly streamService: StreamService,
    @Inject(forwardRef(() => ConversationService))
    private readonly conversationService: ConversationService,
    @Inject(forwardRef(() => EarningService))
    private readonly earningService: EarningService
  ) { }

  public async statEarningLiveStream(conversationId: string) {
    const conversation = await this.conversationService.findById(conversationId);
    if (!conversation) throw new EntityNotFoundException();
    const { type } = conversation;
    const roomName = this.streamService.getRoomName(conversationId, type);
    const stream = await this.streamService.findById(conversation.streamId);
    if (!stream) throw new EntityNotFoundException();
    const sessionId = stream?.sessionId;
    const transactions = await this.TokenPaymentModel.find({ sessionId });
    const transactionIds = transactions.map((s) => s._id);

    const purchasedStream = await Promise.all(transactionIds.map(async (transactionId) => {
      const query = {
        performerId: stream?.performerId,
        transactionId,
        sourceType: 'stream',
        type: 'public_chat'
      };
      const resp = await this.earningModel.find(query);
      return resp;
    }));
    const data = {
      totalPurchasedEarning: purchasedStream.length
    };
    await this.socketService.emitToRoom(roomName, 'public-earning-changed', data);
  }
}
