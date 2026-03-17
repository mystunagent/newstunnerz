import {
  BadRequestException, ForbiddenException, forwardRef, HttpException, Inject, Injectable
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ConversationService } from 'src/modules/message/services';
import { AgendaService, EntityNotFoundException, PageableData, QueueEvent, QueueEventService } from 'src/kernel';
import { FilterQuery, ObjectId } from 'mongodb';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { UserService } from 'src/modules/user/services';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserDto } from 'src/modules/user/dtos';
import { MailerService } from 'src/modules/mailer';
import { PerformerService } from 'src/modules/performer/services';
import * as moment from 'moment';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { BOOKING_STREAM_PROVIDER, BookingStreamStatus, SCHEDULE_APPROVE_BOOK_STREAM_AGENDA } from '../constants';
import { BookingStreamModel } from '../models';
import { BookingStreamService } from './booking-stream.service';
import { PerformerBookingSearchPayload } from '../payloads';
import { BookingStreamDto } from '../dtos';
import { BookingAppointmentApprovedException, BookingStreamExistedException } from '../exceptions';
import { SetUpTimeStreamService } from './setup-time-stream.service';
import { UpcomingStreamService } from './upcoming-stream.service';
import { EVENT } from 'src/kernel/constants';
import { APPROVE_BOOKING_PRIVATE_STREAM_CHANNEL } from 'src/modules/token-transaction/constants';

@Injectable()
export class PerformerBookingStreamService {
  constructor(
    @Inject(BOOKING_STREAM_PROVIDER)
    private readonly bookingStreamModel: Model<BookingStreamModel>,
    private readonly bookingStreamService: BookingStreamService,
    private readonly queueEventService: QueueEventService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => ConversationService))
    private readonly conversationService: ConversationService,
    @Inject(forwardRef(() => SetUpTimeStreamService))
    private readonly setUpTimeStreamService: SetUpTimeStreamService,
    @Inject(forwardRef(() => UpcomingStreamService))
    private readonly upcomingStreamService: UpcomingStreamService,
    @Inject(forwardRef(() => MailerService))
    private readonly mailerService: MailerService,
    @Inject(forwardRef(() => SocketUserService))
    private readonly socketUserService: SocketUserService,
    @Inject(forwardRef(() => AgendaService))
    private readonly agendaService: AgendaService
  ) {
    this.defineJobs();
  }

  private async scheduleBookingStreamJob(bookingStream: any) {
    if(!!bookingStream) {
      const startAt = new Date(bookingStream.startAt);
      const now = new Date();
      const timeBeforeStreamStart = moment(startAt).isAfter(now);
      if (timeBeforeStreamStart) {
        await this.agendaService.schedule(new Date(new Date(bookingStream.startAt).setMinutes(new Date(bookingStream.startAt).getMinutes() - 15)), SCHEDULE_APPROVE_BOOK_STREAM_AGENDA, {
          bookingStream
        });
      }
    }
  }

  private async defineJobs() {
    const collection = (this.agendaService as any)._collection;
    await collection.deleteMany({
      name: {
        $in: [SCHEDULE_APPROVE_BOOK_STREAM_AGENDA]
      }
    });
    this.agendaService.define(SCHEDULE_APPROVE_BOOK_STREAM_AGENDA, {}, this.scheduleBookingStream.bind(this));
    const bookingStream = await this.bookingStreamModel.find({
      startAt: { $gte: moment().startOf('day').toDate() }
    }).lean();
    if (bookingStream.length > 0) {
      await Promise.all(
        bookingStream.map(async (stream) => {
          await this.scheduleBookingStreamJob(stream);
        })
      );
    }
  }

  private async scheduleBookingStream(job: any, done: any) {
    try {
      const { bookingStream } = job.attrs.data;

      const booking = new BookingStreamDto(bookingStream);
      const performer = await this.performerService.findById(booking.performerId);
      const user = await this.userService.findById(booking.userId);

      try {
        // send to performer
        await this.socketUserService.emitToUsers(performer._id.toString(), 'schedule_booking_stream', {
          ...booking,
          userInfo: new UserDto(user).toResponse()
        });
        // send to user
        await this.socketUserService.emitToUsers(user._id.toString(), 'schedule_booking_stream', {
          ...booking,
          performerInfo: new PerformerDto(performer).toSearchResponse()
        });
      } catch (error) {
        console.error('Error socket:', error);
      }
    } catch (e) {
      console.log('Schedule book error', e);
    } finally {
      job.remove();
      // Only reschedule if there are upcoming streams
      const upcomingStream = await this.bookingStreamModel.find({
        startAt: { $gte: moment().startOf('day').toDate() }
      }).lean();
      if (upcomingStream.length > 0) {
        this.agendaService.schedule('5 seconds from now', SCHEDULE_APPROVE_BOOK_STREAM_AGENDA, {});
      }
      typeof done === 'function' && done();
    }
  }

  async search(
    req: PerformerBookingSearchPayload
  ): Promise<PageableData<Partial<BookingStreamDto>>> {
    const query: FilterQuery<BookingStreamModel> = {};
    if (req.performerId) query.performerId = toObjectId(req.performerId);
    if (req.status && req.status !== 'expired') {
      query.status = req.status;
    } else if (req.status && req.status === 'expired') {
      query.startAt = { $lt: new Date() };
    }
    if (req.conversationId) query.conversationId = toObjectId(req.conversationId);

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
    const userIds = appointments.map((a) => a.userId);
    const performerIds = appointments.map((a) => a.performerId);
    const users = await this.userService.findByIds(userIds);
    const performers = await this.performerService.findByIds(performerIds);

    appointments.forEach((a) => {
      const user = users.find((u) => u._id.toString() === a.userId.toString());
      const performer = performers.find((u) => u._id.toString() === a.performerId.toString());
      if (performer) {
        // eslint-disable-next-line no-param-reassign
        a.performerInfo = performer.toSearchResponse();
      }
      if (user) {
        // eslint-disable-next-line no-param-reassign
        a.userInfo = {
          username: user.username
        };
      }
    });

    return {
      total,
      data: appointments.map((a) => a.toResponse())
    };
  }

  async approve(id: string, currentUser: PerformerDto) {
    const result = await this.bookingStreamModel.findById(id);
    if (!result) {
      throw new EntityNotFoundException();
    }
    const user = await this.userService.findById(result.userId);
    if (!currentUser._id.equals(result.performerId)) {
      throw new ForbiddenException();
    }

    if (BookingStreamService.checkIfExpired(result.endAt)) {
      throw new BookingStreamExistedException();
    }

    if (result.status === 'approved') {
      throw new BookingAppointmentApprovedException();
    }

    // check booked or not by different models
    const checkPerformerApprove = await this.bookingStreamService.checkIfExistedApprovePerformer(
      currentUser._id,
      result.startAt,
      result.endAt,
      BookingStreamStatus.APPROVED
    );

    const checkExistUpcoming = await this.upcomingStreamService.checkIfExisted(
      currentUser._id,
      result.startAt,
      result.endAt
    );

    if (checkPerformerApprove || checkExistUpcoming) {
      throw new HttpException('Your schedule is not available for this booking', 400);
    }

    // await this.purchasedItemService.processBookingAppointment(result);
    const data = await this.bookingStreamModel.updateOne(
      { _id: id },
      { $set: { status: 'approved' } }
    );

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
    // send socket for user
    await this.scheduleBookingStreamJob({
      ...result.toObject(),
      status: 'approved'
    });
    // queue
    await this.queueEventService.publish(
      new QueueEvent({
        channel: APPROVE_BOOKING_PRIVATE_STREAM_CHANNEL,
        eventName: EVENT.CREATED,
        data: {
          ...new BookingStreamDto(result),
          status: 'approved'
        }
      })
    )

    await this.mailerService.send({
      to: user.email,
      template: 'performer-book-stream-confirmation',
      subject: 'Booking Stream Confirmation',
      data: {
        startAt: newStartDate,
        endAt: newEndDate,
        usernamePerformer: currentUser.name,
        usernameUser: user.name,
        url: ''
      }
    });

    return data;
  }

  async reject(id: string, currentUser: PerformerDto) {
    const result = await this.bookingStreamService.findById(id);
    if (!result) {
      throw new EntityNotFoundException();
    }
    const user = await this.userService.findById(result.userId);

    if (!currentUser._id.equals(result.performerId)) {
      throw new ForbiddenException();
    }

    if (BookingStreamService.checkIfExpired(result.startAt)) {
      throw new BookingStreamExistedException();
    }

    if (result.status === 'approved') {
      throw new BookingAppointmentApprovedException();
    }

    const data = this.bookingStreamModel.updateOne(
      { _id: id },
      { $set: { status: 'rejected' } }
    );

    await this.mailerService.send({
      to: user.email,
      template: 'performer-booking-stream-reject',
      subject: 'Booking Stream Reject',
      data: {
        usernamePerformer: currentUser.username,
        usernameUser: user.username
      }
    });

    return data;
  }

  async getDetails(id: string | ObjectId, currentUser: PerformerDto) {
    const result = await this.bookingStreamService.findById(id);
    if (!result) throw new EntityNotFoundException();

    if (!result.performerId.equals(currentUser._id)) {
      throw new ForbiddenException();
    }

    const [user, conversation] = await Promise.all([
      this.userService.findById(result.performerId),
      this.conversationService.findById(result.conversationId)
    ]);
    if (!user || !conversation) throw new BadRequestException();

    const dto = new BookingStreamDto(result);
    if (user) dto.userInfo = new UserDto(user).toResponse();
    if (conversation) {
      const url = new URL('live/appointment', process.env.USER_URL);
      url.searchParams.append('conversationId', conversation._id);
      dto.url = url.href;
    }
    return dto;
  }
}
