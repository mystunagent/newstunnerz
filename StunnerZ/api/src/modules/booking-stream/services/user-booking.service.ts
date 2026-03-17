import {
  BadRequestException,
  ForbiddenException, forwardRef, HttpException, Inject, Injectable
} from '@nestjs/common';
import { Model } from 'mongoose';
import { PerformerService } from 'src/modules/performer/services';
import { ConversationService } from 'src/modules/message/services';
import { TokenTransactionService } from 'src/modules/token-transaction/services';
import { UserDto } from 'src/modules/user/dtos';
import { EntityNotFoundException, PageableData } from 'src/kernel';
import { FilterQuery, ObjectId } from 'mongodb';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { MailerService } from 'src/modules/mailer';
import * as moment from 'moment';
import { NotEnoughMoneyException } from 'src/modules/token-transaction/exceptions';
import { BookingStreamService } from './booking-stream.service';
import { BookingStreamModel } from '../models';
import { BOOKING_STREAM_PROVIDER, BookingStreamStatus, formatDateNotSecond } from '../constants';
import { CreateBookingPayload, UpdateBookingPayload, UserBookingSearchPayload } from '../payloads';
import { BookingStreamExpiredException, InvalidDateRangerException } from '../exceptions';
import { BookingStreamDto } from '../dtos';
import { SetUpTimeStreamService } from './setup-time-stream.service';

@Injectable()
export class UserBookingStreamService {
  constructor(
    @Inject(BOOKING_STREAM_PROVIDER)
    private readonly bookingStreamModel: Model<BookingStreamModel>,
    private readonly bookingStreamService: BookingStreamService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => SetUpTimeStreamService))
    private readonly setUpTimeStreamService: SetUpTimeStreamService,
    @Inject(forwardRef(() => ConversationService))
    private readonly conversationService: ConversationService,
    @Inject(forwardRef(() => TokenTransactionService))
    private readonly tokenTransactionService: TokenTransactionService,
    @Inject(forwardRef(() => MailerService))
    private readonly mailerService: MailerService
  ) {}

  async request(
    payload: CreateBookingPayload,
    performerId: string | ObjectId,
    currentUser: UserDto
  ) {
    if (!payload.idTime) {
      throw new HttpException('Please provide a time', 400);
    }

    const findTime = await this.setUpTimeStreamService.findById(payload.idTime);
    if (!findTime) {
      throw new EntityNotFoundException();
    }
    if (findTime && findTime.status === 'inactive') {
      throw new HttpException('Time inactive', 400);
    }

    if (findTime) {
      if (!moment(payload.startAt).isBetween(findTime.startAt, findTime.endAt, 'minutes', '[]')
      || !moment(payload.endAt).isBetween(findTime.startAt, findTime.endAt, 'minutes', '[]')) {
        throw new HttpException('Please provide a valid time', 400);
      }
    }

    const performer = await this.performerService.findById(performerId);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    const { startAt, endAt } = payload;
    if (!BookingStreamService.checkIsValidDateRanger(startAt, endAt)) {
      throw new InvalidDateRangerException();
    }

    const checkExistedPending = await this.bookingStreamService.checkIfExisted(
      performerId,
      currentUser._id,
      startAt,
      endAt,
      BookingStreamStatus.PENDING
    );

    const checkExistedApprove = await this.bookingStreamService.checkIfExisted(
      performerId,
      currentUser._id,
      startAt,
      endAt,
      BookingStreamStatus.APPROVED
    );

    if (checkExistedPending || checkExistedApprove) {
      throw new BookingStreamExpiredException();
    }

    const checkExisted = await this.bookingStreamService.checkIfExistedPerformer(
      currentUser._id,
      startAt,
      endAt,
    );

    if(checkExisted) {
      throw new HttpException('The selected time is unavailable in your schedule', 400);
    }

    const checkPerformerApprove = await this.bookingStreamService.checkIfExistedApprovePerformer(
      performerId,
      startAt,
      endAt,
      BookingStreamStatus.APPROVED
    );

    if (checkPerformerApprove) {
      throw new HttpException('Your schedule is not available for this booking', 400);
    }

    const diffInMinutes = moment(new Date(endAt).setSeconds(0)).diff(moment(new Date(startAt).setSeconds(0)), 'minutes');

    if (Number(diffInMinutes) < 4) {
      throw new HttpException('Please set a minimum of 5 minutes', 400);
    }

    if (currentUser.balance <= (Number(performer.pricePerMinuteBookStream || 10) * Number(diffInMinutes))) {
      throw new NotEnoughMoneyException();
    }

    const result = await this.bookingStreamModel.create({
      performerId,
      userId: currentUser._id,
      token: performer.pricePerMinuteBookStream || 10,
      startAt,
      endAt,
      idSetUpTime: findTime._id
    });
    // change date
    const startDate = new Date(result.startAt);
    const endDate = new Date(result.endAt);
    startDate.setHours(startDate.getHours() + 5);
    startDate.setMinutes(startDate.getMinutes() + 30);

    endDate.setHours(endDate.getHours() + 5);
    endDate.setMinutes(endDate.getMinutes() + 30);
    // to string
    const newStartDate = startDate.toLocaleString();
    const newEndDate = endDate.toLocaleString();

    // features for charge book private stream
    // await this.tokenTransactionService.processBookingPrivateStream(result);

    const dto = new BookingStreamDto(result);
    await this.mailerService.send({
      to: performer.email,
      template: 'user-book-stream',
      subject: 'User Book Stream',
      data: {
        startAt: newStartDate,
        endDate: newEndDate,
        usernamePerformer: performer.username,
        usernameUser: currentUser.username
      }
    });
    return dto.toResponse();
  }

  async update(
    id: string | ObjectId,
    payload: UpdateBookingPayload,
    currentUser: UserDto
  ) {
    const appointment = await this.bookingStreamService.findById(id);
    if (!appointment) {
      throw new EntityNotFoundException();
    }

    const { status, performerId, userId } = appointment;
    const { endAt, startAt } = payload;
    if (currentUser._id.toString() !== userId.toString()) {
      throw new ForbiddenException();
    }

    if (status === 'approved') {
      // throw
    }

    if (!BookingStreamService.checkIsValidDateRanger(startAt, endAt)) {
      throw new InvalidDateRangerException();
    }

    const checkExisted = await this.bookingStreamService.checkIfExisted(
      performerId,
      currentUser._id,
      startAt,
      endAt,
      'approved'
    );
    if (checkExisted) {
      // throw
    }

    return this.bookingStreamModel.updateOne(
      {
        _id: id
      },
      {
        $set: {
          startAt,
          endAt,
          updatedAt: new Date()
        }
      }
    );
  }

  async delete(id: string | ObjectId, currentUser: UserDto) {
    const appointment = await this.bookingStreamService.findById(id);
    if (!appointment) {
      throw new EntityNotFoundException();
    }

    const { userId } = appointment;
    if (currentUser._id.toString() !== userId.toString()) {
      throw new ForbiddenException();
    }

    return this.bookingStreamModel.deleteOne({ _id: id });
  }

  async search(
    req: UserBookingSearchPayload
  ): Promise<PageableData<Partial<BookingStreamDto>>> {
    const query: FilterQuery<BookingStreamModel> = {};
    if (req.userId) query.userId = toObjectId(req.userId);
    if (req.performerId) query.performerId = toObjectId(req.performerId);
    if (req.conversationId) query.conversationId = toObjectId(req.conversationId);
    if (req.status && req.status !== 'expired') {
      query.status = req.status;
    } else if (req.status && req.status === 'expired') {
      query.startAt = { $lt: new Date() };
    }

    if (req.startAt && req.endAt) {
      query.startAt = { $gte: moment(req.startAt).startOf('day').toDate() };
      query.endAt = { $lte: moment(req.endAt).endOf('day').toDate() };
    }

    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || 'desc'
    };

    const [data, total] = await Promise.all([
      this.bookingStreamModel.find(query)
        .sort(sort)
        .limit(parseInt(req.limit as string, 10))
        .skip(parseInt(req.offset as string, 10))
        .exec(),
      this.bookingStreamModel.countDocuments(query)
    ]);

    const appointments = data.map((d) => new BookingStreamDto(d));
    const performerIds = appointments.map((a) => a.performerId);
    const performers = await this.performerService.findByIds(performerIds);
    if (performers.length) {
      appointments.forEach((a) => {
        const performer = performers.find(
          (p) => p._id.toString() === a.performerId.toString()
        );
        if (performer) {
          // eslint-disable-next-line no-param-reassign
          a.performerInfo = {
            username: performer.username
          };
        }
      });
    }

    return {
      total,
      data: appointments.map((a) => a.toResponse())
    };
  }

  async getDetails(id: string | ObjectId, currentUser: UserDto) {
    const result = await this.bookingStreamModel.findById(id);
    if (!result) throw new EntityNotFoundException();

    if (!result.userId.equals(currentUser._id)) {
      throw new ForbiddenException();
    }

    const [performer, conversation] = await Promise.all([
      this.performerService.findById(result.performerId),
      this.conversationService.findById(result.conversationId)
    ]);
    if (!performer || !conversation) throw new BadRequestException();

    const dto = new BookingStreamDto(result);
    if (performer) dto.performerInfo = performer.toSearchResponse();
    if (conversation) {
      const url = new URL('stream/appointment', process.env.USER_URL);
      url.searchParams.append('conversationId', conversation._id);
      dto.url = url.href;
    }
    return dto;
  }
}
