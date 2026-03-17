import {
  Injectable,
  Inject,
  forwardRef,
  ForbiddenException,
  HttpException
} from '@nestjs/common';
import { PerformerService } from 'src/modules/performer/services';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { EntityNotFoundException, PageableData } from 'src/kernel';
import { v4 as uuidv4 } from 'uuid';
import { ConversationService } from 'src/modules/message/services';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { PerformerDto } from 'src/modules/performer/dtos';
import * as moment from 'moment';
import { flatten, merge, uniq, uniqBy } from 'lodash';
import { UserService } from 'src/modules/user/services';
import { UserDto } from 'src/modules/user/dtos';
import { SUBSCRIPTION_STATUS } from 'src/modules/subscription/constants';
import { TokenTransactionService } from 'src/modules/token-transaction/services';
import { PURCHASE_ITEM_STATUS } from 'src/modules/token-transaction/constants';
import { BookingStreamService, UpcomingStreamService } from 'src/modules/booking-stream/services';
import { SocketUserService } from '../../socket/services/socket-user.service';
import { PRIVATE_CHAT, PUBLIC_CHAT } from '../constant';
import { StreamModel } from '../models';
import { STREAM_MODEL_PROVIDER } from '../providers/stream.provider';
import { StreamOfflineException } from '../exceptions';
import {
  SearchStreamPayload,
  SetDurationPayload,
  StartStreamPayload,
  UpdateStreamPayload
} from '../payloads';
import { StreamDto } from '../dtos';
import { toObjectId } from 'src/kernel/helpers/string.helper';

@Injectable()
export class StreamService {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(STREAM_MODEL_PROVIDER)
    private readonly streamModel: Model<StreamModel>,
    private readonly conversationService: ConversationService,
    private readonly socketUserService: SocketUserService,
    @Inject(forwardRef(() => TokenTransactionService))
    private readonly tokenTransactionService: TokenTransactionService,
    @Inject(forwardRef(() => BookingStreamService))
    private readonly bookingStreamService: BookingStreamService
  ) { }

  public async findOne(query): Promise<StreamModel> {
    const stream = await this.streamModel.findOne(query);
    return stream;
  }

  public async findById(id: string | ObjectId): Promise<StreamModel> {
    const stream = await this.streamModel.findById(id);
    return stream;
  }

  public async findByIds(ids: string[] | ObjectId[]): Promise<StreamModel[]> {
    const streams = await this.streamModel.find({ _id: { $in: ids } });
    return streams;
  }

  async adminSearch(
    req: SearchStreamPayload
  ): Promise<PageableData<StreamDto>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      const searchValue = { $regex: regexp };
      query.$or = [{ title: searchValue }, { description: searchValue }];
    }
    if (req.performerId) {
      query.performerId = req.performerId;
    }
    if (req.type) {
      query.type = req.type;
    }
    if (req.isFree) {
      query.isFree = req.isFree === 'true';
    }
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gte: moment(req.fromDate).startOf('day'),
        $lte: moment(req.toDate).endOf('day')
      };
    }
    const sort = { isStreaming: -1, updatedAt: -1, createdAt: -1 };
    const [data, total] = await Promise.all([
      this.streamModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.streamModel.countDocuments(query)
    ]);
    const performerIds = uniq(data.map((d) => d.performerId));
    const streams = data.map((d) => new StreamDto(d));
    const [performers] = await Promise.all([
      this.performerService.findByIds(performerIds)
    ]);
    streams.forEach((stream) => {
      const performer = stream.performerId
        && performers.find((p) => `${p._id}` === `${stream.performerId}`);
      // eslint-disable-next-line no-param-reassign
      stream.performerInfo = performer
        ? new PerformerDto(performer).toResponse()
        : null;
    });
    return {
      data: streams,
      total
    };
  }

  async userSearch(
    req: SearchStreamPayload,
    user: UserDto
  ): Promise<PageableData<StreamDto>> {
    const query = {
      isStreaming: 1
    } as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      const searchValue = { $regex: regexp };
      query.$or = [{ title: searchValue }, { description: searchValue }];
    }
    if (req.performerId) {
      query.performerId = req.performerId;
    }
    if (req.isFree) {
      query.isFree = req.isFree === 'true';
    }
    const sort = { updatedAt: -1, createdAt: -1 };
    const [data, total] = await Promise.all([
      this.streamModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.streamModel.countDocuments(query)
    ]);
    const performerIds = uniq(data.map((d) => d.performerId));
    const streams = data.map((d) => new StreamDto(d));
    const [performers, subscriptions, conversations] = await Promise.all([
      this.performerService.findByIds(performerIds),
      user
        ? this.subscriptionService.findSubscriptionList({
          performerId: { $in: performerIds },
          userId: user._id,
          expiredAt: { $gt: new Date() }
        })
        : [],
      this.conversationService.findByStreamIds(streams.map((s) => s._id))
    ]);
    streams.forEach((stream) => {
      const performer = stream.performerId
        && performers.find((p) => `${p._id}` === `${stream.performerId}`);
      const subscription = subscriptions.find(
        (s) => `${s.performerId}` === `${stream.performerId}`
      );
      // eslint-disable-next-line no-param-reassign
      stream.performerInfo = performer
        ? new PerformerDto(performer).toResponse()
        : null;
      // eslint-disable-next-line no-param-reassign
      stream.isSubscribed = !!subscription;
      const conversation = conversations.find((c) => c.streamId.equals(stream._id));
      // eslint-disable-next-line no-param-reassign
      stream.conversationId = conversation && conversation._id;
    });
    return {
      data: streams,
      total
    };
  }

  public async endSessionStream(streamId: string | ObjectId): Promise<any> {
    const stream = await this.streamModel.findOne({ _id: streamId });
    if (!stream) {
      throw new EntityNotFoundException();
    }
    if (!stream.isStreaming) {
      throw new StreamOfflineException();
    }
    const conversation = await this.conversationService.findOne({
      streamId: stream._id
    });
    if (!conversation) {
      throw new EntityNotFoundException();
    }
    const roomName = this.getRoomName(conversation._id, conversation.type);
    await this.socketUserService.emitToRoom(
      roomName,
      'admin-end-session-stream',
      {
        streamId: stream._id,
        conversationId: conversation._id,
        createdAt: new Date()
      }
    );
    return { ended: true };
  }

  public async findByPerformerId(
    performerId: string | ObjectId,
    payload?: Partial<StreamDto>
  ): Promise<StreamModel> {
    return this.streamModel.findOne({ performerId, ...payload });
  }

  public async checkMemberBookingRoom(conversationId: string) {
    const conversation = await this.conversationService.findById(conversationId);

    if(conversation) {
      const stream = await this.streamModel.findById(conversation.streamId);

      const connections = await this.socketUserService.getRoomUserConnections(
        stream?.sessionId
      );
  
      const memberIds: string[] = [];
      Object.keys(connections).forEach((id) => {
        const value = connections[id].split(',');
        if (value[0]) {
          memberIds.push(id);
        }
      });
      return memberIds;
    }
  }

  public async goLive(payload: StartStreamPayload, performer: PerformerDto) {
    const {
      price, isFree, title, description, optionStream
    } = payload;
    let stream = await this.streamModel.findOne({
      performerId: performer._id,
      type: PUBLIC_CHAT
    });
    const sessionId = uuidv4();
    if (!stream) {
      // eslint-disable-next-line new-cap
      stream = new this.streamModel({
        sessionId,
        performerId: performer._id,
        type: PUBLIC_CHAT
      });
    }
    stream.sessionId = sessionId;
    stream.streamingTime = 0;
    stream.isStreaming = 0;
    stream.totalPurchased = 0;
    stream.isFree = isFree;
    // stream.price = isFree ? 0 : price;
    stream.price = price;
    stream.title = title;
    stream.description = description || '';
    stream.optionStream = optionStream;
    stream.stats = { members: 0, likes: 0 };
    await stream.save();

    // if (payload.upcoming && payload.upcoming === true) {
    //   await this.upcomingStreamService.updateStatus(payload.upcomingId.toString(), 'streamed');
    // }

    let conversation = await this.conversationService.findOne({
      type: `stream_${PUBLIC_CHAT}`,
      performerId: performer._id,
      streamId: stream._id
    });
    if (!conversation) {
      conversation = await this.conversationService.createStreamConversation(
        new StreamDto(stream)
      );
    }
    await this.performerService.updateStreamIdForPerformer(performer._id, stream._id);

    return {
      conversation,
      ...new StreamDto(stream).toResponse(true)
    };
  }

  public async editLive(id, payload: UpdateStreamPayload) {
    const stream = await this.streamModel.findById(id);
    if (!stream) throw new EntityNotFoundException();
    merge(stream, payload);
    await stream.save();
    return new StreamDto(stream).toResponse(true);
  }

  public async searchLive(streamId: string) {
    const stream = await this.streamModel.findById(streamId);
    if (!stream) throw new EntityNotFoundException();
    return new StreamDto(stream).toResponse(true);
  }

  public async updateTotalPurchasedStream(
    streamId: string,
    performer: PerformerDto
  ) {
    const stream = await this.streamModel.findById(streamId);
    if (!stream) {
      throw new EntityNotFoundException();
    }
    if (`${performer._id}` !== `${stream.performerId}`) {
      throw new ForbiddenException();
    }
    await this.streamModel.updateOne({ _id: streamId }, { $inc: { totalPurchased: 1 } });
    await stream.save();
    return { updated: true };
  }

  public async joinPublicChat(performerId: string, user: UserDto) {
    const stream = await this.streamModel
      .findOne({
        performerId,
        type: PUBLIC_CHAT
      })
      .lean();

    if (!stream) {
      throw new EntityNotFoundException();
    }
    if (!stream.isStreaming) {
      throw new StreamOfflineException();
    }

    const hasSubscribed = this.subscriptionService.checkSubscribed(
      performerId,
      user._id
    );
    if (!hasSubscribed) throw new HttpException('Please subscribe model to join live', 403);

    const hasPurchased = !stream.isFree && !!(await this.tokenTransactionService.findOne({
      status: PURCHASE_ITEM_STATUS.SUCCESS,
      sourceId: user._id,
      sessionId: stream.sessionId
    }));
    return new StreamDto({ ...stream, hasPurchased }).toResponse();
  }

  public getRoomName(id: string | ObjectId, roomType: string) {
    return `conversation-${roomType}-${id}`;
  }

  public async updateStreamDuration(
    payload: SetDurationPayload,
    performer: PerformerDto
  ) {
    const { streamId, duration } = payload;
    const stream = await this.streamModel.findById(streamId);
    if (!stream) {
      throw new EntityNotFoundException();
    }
    if (`${performer._id}` !== `${stream.performerId}`) {
      throw new ForbiddenException();
    }
    if (stream.streamingTime >= duration) {
      return { updated: true };
    }
    stream.streamingTime = duration;
    await stream.save();
    return { updated: true };
  }

  public async requestPrivateChat(
    user: UserDto,
    performerId: string | ObjectId
  ) {
    const performer = await this.performerService.findById(performerId);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    const findAvailable = await this.streamModel.findOne({
      performerId,
      type: PRIVATE_CHAT,
      waiting: true,
      includeIds: { $in: [user._id] }
    });
    if(findAvailable) {
      const conversation = await this.conversationService.getPrivateConversationByStreamId(findAvailable._id);
      return { conversation, sessionId: findAvailable.sessionId, activeStream: {
        ...new StreamDto(findAvailable).toResponse(true),
        userId: user._id
      } };
    }

    // const subscribed = await this.subscriptionService.checkSubscribed(
    //   performerId,
    //   user._id
    // );
    // if (!subscribed) {
    //   throw new HttpException('Please subscribe model to send private request', 403);
    // }

    if (user.balance < performer.privateChatPrice) {
      throw new HttpException('You have not enough token', 400);
    }

    // const isOnline = await this.socketUserService.isOnline(performer._id);
    // if (!isOnline) {
    //   throw new HttpException(`${performer.username} is offline`, 400);
    // }

    if (performer.streamingStatus === 'private') {
      throw new HttpException(`${performer.username} is streaming privately, please connect after some time`, 400);
    }

    const data = {
      sessionId: uuidv4(),
      performerId,
      includeIds: [user._id],
      type: PRIVATE_CHAT,
      isStreaming: true,
      waiting: true
    };
    const stream = await this.streamModel.create(data);
    const recipients = [
      { source: 'performer', sourceId: new ObjectId(performerId) },
      { source: 'user', sourceId: user._id }
    ];
    const conversation = await this.conversationService.createStreamConversation(
      new StreamDto(stream),
      recipients
    );

    const {
      username, email, avatar, _id, balance
    } = user;
    await this.socketUserService.emitToUsers(
      performerId,
      'private-chat-request',
      {
        user: {
          username, email, avatar, _id, balance
        },
        streamId: stream._id,
        conversationId: conversation._id,
        createdAt: new Date()
      }
    );

    return { conversation, sessionId: stream.sessionId, activeStream: {
      ...new StreamDto(stream).toResponse(true),
      userId: user._id
    } };
  }

  public async getBookPrivateChat(
    conversationId: string
  ) {
    const conversation = await this.conversationService.findById(conversationId);
    
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    const findAvailable = await this.streamModel.findById(conversation.streamId);
    if(findAvailable) {
      const upcoming = await this.bookingStreamService.findOne({ conversationId });
      return { conversation, sessionId: findAvailable.sessionId, activeStream: {
        ...new StreamDto(findAvailable).toResponse(true),
        userId: findAvailable.includeIds[0]
      }, upcoming };
    }
  }

  public async finishBookPrivateChat(
    streamId: string
  ) {
    const stream = await this.streamModel.findById(streamId);
    if (!stream) {
      throw new EntityNotFoundException();
    }
    await this.streamModel.updateOne({ _id: stream._id }, {
      $set: {
        waiting: false
      }
    })
  }

  async sendNotifyModelJoinPrivateRoom(id: string){
    const stream = await this.streamModel.findById(id);
    if(stream){
      await this.socketUserService.emitToUsers(stream?.includeIds, 'private-stream/model-join', {
        stream
      })
    }
  }

  async userJoinBookingRoom(id: string){
    const stream = await this.streamModel.findById(id);
    if(stream){
      await this.socketUserService.emitToUsers(stream?.performerId, 'private-stream/user-join', {
        stream
      })
    }
  }

  async sendNotifyModelLeftPrivateRoom(id: string){
    const stream = await this.streamModel.findById(id);
    if(stream){
      await this.socketUserService.emitToUsers(stream?.includeIds, 'private-stream/model-left', {
        stream
      })
    }
  }

  async sendNotifyUserLeftPrivateRoom(id: string){
    const stream = await this.streamModel.findById(id);
    if(stream){
      await this.socketUserService.emitToUsers(stream?.performerId, 'private-stream/user-left', {
        stream
      })
    }
  }

  public async acceptPrivateChat(id: string, performerId: ObjectId, username?: string) {
    const conversation = await this.conversationService.findById(id);
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    const recipient = conversation.recipients.find(
      (r) => r.sourceId.toString() === performerId.toString()
        && r.source === 'performer'
    );
    if (!recipient) {
      throw new ForbiddenException();
    }

    const stream = await this.findById(conversation.streamId);
    if (!stream && stream.performerId !== performerId) {
      throw new EntityNotFoundException();
    }

    // if (!stream.isStreaming) {
    //   throw new StreamOfflineException();
    // }

    const waitingSteams = await this.streamModel.find({
      performerId: toObjectId(performerId),
      type: PRIVATE_CHAT,
      waiting: true,
      _id: { $ne: stream._id }
    });

    const userIds = uniqBy(flatten(waitingSteams.map((item) => item.includeIds)), (item) => item.toString()).filter((userId) => `${userId}` !== `${performerId}`);

    await this.socketUserService.emitToUsers(userIds, 'notify_and_redirect', {
      text: `Model accepted private call with different user. Please connect after some time.`,
      href: `/${username}`
    });

    await this.streamModel.updateMany({
      performerId: toObjectId(performerId),
      type: PRIVATE_CHAT,
      waiting: true
    }, { $set: { waiting: false } });

    return { conversation, sessionId: stream.sessionId, activeStream: {
      ...new StreamDto(stream).toResponse(true),
      userId: stream.includeIds[0]
    } };
  }

  public async stopAllPrivateWait(performerId: ObjectId){
    const waitingStreams = await this.streamModel.find({
      performerId: toObjectId(performerId),
      type: PRIVATE_CHAT,
      waiting: true
    });

    if(waitingStreams.length > 0){
      await this.streamModel.updateMany({
        performerId: toObjectId(performerId),
        type: PRIVATE_CHAT,
        waiting: true
      }, { $set: { waiting: false } });
    }
    return true;
  }

  public async removeRequestPrivateStream(conversationId: string) {
    const findStream = await this.conversationService.findById(conversationId);
    if(findStream) {
      const stream = await this.streamModel.findById(findStream.streamId);
      await this.socketUserService.emitToUsers(stream.includeIds[0]._id, 'reject_request_private_stream', stream);
      await this.streamModel.deleteOne({ _id: findStream.streamId });
    }
  }

  public async userRemoveRequest(user: UserDto, performerId: string) {
    const streams = await this.streamModel.find({
      performerId,
      type: PRIVATE_CHAT,
      includeIds: { $in: [user._id] }
    });
  
    if (streams.length > 0) {
      const filter = { _id: { $in: streams.map(s => s._id) } };
      
      const update = {
        $pull: { includeIds: user._id },
        $set: { waiting: false } // Set waiting to false
      };
      await this.streamModel.updateMany(filter, update);
    }
  
    return true;
  }

  public async getPrivateChat(performerId: string) {
    const streamStarted = await this.streamModel.findOne({
      performerId,
      isStreaming: 1,
      type: 'private'
    });

    if (streamStarted) {
      return false;
    }

    return true;
  }

  public async getAvailablePrivateStreamRequestsForPerformer(performerId: string | ObjectId) {
    const streams = await this.streamModel.find({
      performerId,
      type: PRIVATE_CHAT,
      waiting: true
    });

    if (!streams.length) return [];
    const streamIds = streams.map((s) => s._id);

    const userIds = streams.reduce((res, stream) => {
      const results = [...res];
      if (stream.includeIds?.length) {
        results.push(
          ...stream.includeIds.filter((id) => id.toString() !== performerId.toString())
        );
      }
      return results;
    }, []);
    if (!userIds.length) return [];
    const users = await this.userService.findByIds(userIds);

    const conversations = await this.conversationService.getConversationsByStreamIds(streamIds);

    return streams.reduce((res, stream) => {
      const results = res;
      if (!stream.includeIds?.length) return results;
      const userId = stream.includeIds.find((id) => id.toString() !== performerId.toString());
      const user = users.find((u) => u._id.toString() === userId.toString());
      const conversation = conversations.find((c) => c.streamId.toString() === stream._id.toString());

      const obj = {
        performerId,
        type: PRIVATE_CHAT,
        createdAt: stream.createdAt,
        updatedA: stream.updatedAt,
        requester: new UserDto(user).toResponse(),
        conversationId: conversation._id
      };
      results.push(obj);
      return results;
    }, []);
  }

  async sendNotifyRedirectPrivateChat(conversationId: string) {
    const conversation = await this.conversationService.findById(conversationId);
    if (!conversation) {
      throw new EntityNotFoundException();
    }
    const roomName = await this.getRoomName(conversation._id, conversation.type);
    await this.socketUserService.emitToRoom(roomName, 'redirect-private-chat', conversation);
    return true;
  }

  async autoUpdateTotalMember (id: string, total: string) {
    const stream = await this.streamModel.findById(id);
    if (stream) {
      await this.streamModel.updateOne({ _id: stream._id }, {
        $set: {
          'stats.members': Number(total)
        }
      })
    }
  }
}
