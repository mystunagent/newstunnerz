import {
  forwardRef,
  HttpException, Inject, Injectable
} from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { PerformerService } from 'src/modules/performer/services';
import { ObjectId } from 'mongodb';
import { EntityNotFoundException, PageableData } from 'src/kernel';
import { plainToClass } from 'class-transformer';
import { MailerService } from 'src/modules/mailer';
import { PerformerDto } from 'src/modules/performer/dtos';
import { SettingService } from 'src/modules/settings';
import { TokenTransactionService } from 'src/modules/token-transaction/services';
import { BookEventScheduleModel } from '../models/book-event.module';
import { BOOK_EVENT_PROVIDER } from '../providers';
import { BookEventScheduleDto, EventScheduleDto } from '../dtos';
import { EventService } from './event.service';
import { BookEventScheduleSearchPayload } from '../payloads';

@Injectable()
export class BookEventService {
  constructor(
    @Inject(BOOK_EVENT_PROVIDER)
    private readonly bookEventScheduleModel: Model<BookEventScheduleModel>,
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => EventService))
    private readonly eventService: EventService,
    @Inject(forwardRef(() => MailerService))
    private readonly mailerService: MailerService,
    @Inject(forwardRef(() => SettingService))
    private readonly settingService: SettingService,
    @Inject(forwardRef(() => TokenTransactionService))
    private readonly tokenTransactionService: TokenTransactionService
  ) {}

  async findOne(id: string | ObjectId): Promise<BookEventScheduleDto> {
    const schedule = await this.bookEventScheduleModel.findOne({ _id: id }).lean();
    if (!schedule) {
      throw new EntityNotFoundException();
    }
    const dto = plainToClass(BookEventScheduleDto, { ...schedule });
    return dto;
  }

  async findById(id: string | ObjectId) {
    return this.bookEventScheduleModel.findOne({ _id: id });
  }

  public async findByIds(Ids: string[] | ObjectId[]) {
    const data = await this.bookEventScheduleModel.find({ _id: { $in: Ids } }).lean().exec();
    return data.map((d) => new BookEventScheduleDto(d));
  }

  public async findByEventIds(Ids: string[] | ObjectId[], performerId: string) {
    const data = await this.bookEventScheduleModel.find({ eventId: { $in: Ids }, performerId }).lean().exec();
    return data.map((d) => new BookEventScheduleDto(d));
  }

  public async performerBookEvent(id: string, performer: PerformerDto) {
    const schedule = await this.eventService.findById(id);
    if (!schedule) {
      throw new EntityNotFoundException();
    }
    const checkExists = await this.bookEventScheduleModel.findOne({ eventId: schedule._id.toString() });
    if (schedule.isPrivate === true) {
      if (!schedule.performerIds.includes(performer._id)) {
        throw new HttpException('This event is private and you cannot book', 400);
      }
    }

    if (schedule.availability === 0) {
      throw new HttpException('This event has sold out', 400);
    }

    if (checkExists && (checkExists.performerId.toString() === performer._id.toString() || ObjectId(checkExists.performerId).equals(performer._id))) {
      throw new HttpException('You booked this event', 400);
    }

    const data = { eventId: id, performerId: performer._id.toString() };
    const result = await this.bookEventScheduleModel.create(data);
    await this.eventService.updateAvailability(id, Number(schedule.availability - 1));
    await this.tokenTransactionService.processBookingEvent({
      ...new BookEventScheduleDto(result),
      ...new EventScheduleDto(schedule)
    });
    // send to model
    // const adminEmail = (await this.settingService.getKeyValue(SETTING_KEYS.ADMIN_EMAIL)) || process.env.ADMIN_EMAIL;
    await this.mailerService.send({
      subject: 'New Model Book Event',
      to: schedule.email,
      data: {
        ...new EventScheduleDto(schedule),
        performer: new PerformerDto(performer)
      },
      template: 'performer-has-booked-events'
    });
    return result;
  }

  async search(
    req: BookEventScheduleSearchPayload
  ): Promise<PageableData<BookEventScheduleDto>> {
    const query: FilterQuery<BookEventScheduleModel> = {};
    if (req.performerId) {
      query.performerId = req.performerId;
    }
    if (req.eventId) {
      query.eventId = req.eventId;
    }
    if (req.status) {
      query.status = req.status;
    }
    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || 'desc'
    };
    const [schedules, total] = await Promise.all([
      this.bookEventScheduleModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.bookEventScheduleModel.countDocuments(query)
    ]);
    const data = schedules.map((d) => new BookEventScheduleDto(d));
    const performerIds = data.map((a) => a.performerId);
    const eventIds = data.map((a) => a.eventId);
    const performers = await this.performerService.findByIds(performerIds);
    const events = await this.eventService.findByIds(eventIds);
    if (performers.length) {
      data.forEach((a) => {
        const performer = performers.find(
          (p) => p._id.toString() === a.performerId.toString()
        );
        if (performer) {
          // eslint-disable-next-line no-param-reassign
          a.performerInfo = {
            ...performer.toSearchResponse()
          };
        }
      });
    }
    if (events.length) {
      data.forEach((a) => {
        const event = events.find(
          (p) => p._id.toString() === a.eventId.toString()
        );
        if (event) {
          // eslint-disable-next-line no-param-reassign
          a.eventInfo = {
            ...new EventScheduleDto(event)
          };
        }
      });
    }
    return { data, total };
  }

  async adminSearch(
    req: BookEventScheduleSearchPayload
  ): Promise<PageableData<BookEventScheduleDto>> {
    const query: FilterQuery<BookEventScheduleModel> = {};
    if (req.performerId) {
      query.performerId = req.performerId;
    }
    if (req.eventId) {
      query.eventId = req.eventId;
    }
    if (req.status) {
      query.status = req.status;
    }
    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || 'desc'
    };
    const [schedules, total] = await Promise.all([
      this.bookEventScheduleModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.bookEventScheduleModel.countDocuments(query)
    ]);
    const data = schedules.map((d) => new BookEventScheduleDto(d));
    const performerIds = data.map((a) => a.performerId);
    const eventIds = data.map((a) => a.eventId);
    const performers = await this.performerService.findByIds(performerIds);
    const events = await this.eventService.findByIds(eventIds);
    if (performers.length) {
      data.forEach((a) => {
        const performer = performers.find(
          (p) => p._id.toString() === a.performerId.toString()
        );
        if (performer) {
          // eslint-disable-next-line no-param-reassign
          a.performerInfo = {
            ...performer.toSearchResponse()
          };
        }
      });
    }
    if (events.length) {
      data.forEach((a) => {
        const event = events.find(
          (p) => p._id.toString() === a.eventId.toString()
        );
        if (event) {
          // eslint-disable-next-line no-param-reassign
          a.eventInfo = {
            ...new EventScheduleDto(event)
          };
        }
      });
    }
    return { data, total };
  }

  async deleteAll() {
    await this.bookEventScheduleModel.deleteMany({});
    return true;
  }

  public async adminApprove(id: string) {
    const bookEventSchedule = await this.bookEventScheduleModel.findById(id);
    if (!bookEventSchedule) {
      throw new EntityNotFoundException();
    }

    if (bookEventSchedule.status === 'approved') {
      throw new HttpException('You approved this event', 400);
    }
    const event = await this.eventService.findById(bookEventSchedule.eventId);
    if (!event) {
      throw new HttpException('This event not found', 400);
    }
    if (new Date(event.startAt) < new Date()) {
      throw new HttpException('The event start time has already passed', 400);
    }

    await this.bookEventScheduleModel.updateOne({ _id: bookEventSchedule._id }, {
      $set: {
        status: 'approved'
      }
    })

    const performer = await this.performerService.findById(bookEventSchedule.performerId);
    await this.mailerService.send({
      subject: 'Your request for the event is approved',
      to: performer?.email,
      data: {
        ...new EventScheduleDto(event),
        username: performer?.name
      },
      template: 'admin-approved-booking-events'
    });

    return true;
  }

  public async adminRejected(id: string) {
    const bookEventSchedule = await this.bookEventScheduleModel.findById(id);
    if (!bookEventSchedule) {
      throw new EntityNotFoundException();
    }

    if (bookEventSchedule.status === 'approved') {
      throw new HttpException('You approved this event', 400);
    }

    await this.bookEventScheduleModel.updateOne({ _id: bookEventSchedule._id }, {
      $set: {
        status: 'rejected'
      }
    })
    const event = await this.eventService.findById(bookEventSchedule.eventId);
    const result = await this.bookEventScheduleModel.findById(id);

    await this.eventService.updateAvailability(event._id, Number(event.availability + 1));
    await this.tokenTransactionService.processRejectBookingEvent({
      ...new BookEventScheduleDto(result),
      ...new EventScheduleDto(event)
    });
    const performer = await this.performerService.findById(bookEventSchedule.performerId);
    performer && await this.mailerService.send({
      subject: 'Host rejected request event',
      to: performer.email,
      data: {
        ...new EventScheduleDto(event),
        username: performer.name
      },
      template: 'admin-rejected-booking-event'
    });

    return true;
  }
}
