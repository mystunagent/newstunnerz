import {
  BadRequestException, forwardRef, HttpException, HttpStatus, Inject, Injectable
} from '@nestjs/common';
import { Model } from 'mongoose';
import { FilterQuery, ObjectId } from 'mongodb';
import { EntityNotFoundException, PageableData } from 'src/kernel';
import { plainToClass } from 'class-transformer';
import * as moment from 'moment';
import { merge } from 'lodash';

import { FileService } from 'src/modules/file/services';
import { FileDto } from 'src/modules/file';
import { MailerService } from 'src/modules/mailer';
import { PerformerDto } from 'src/modules/performer/dtos';
import { EVENT_PROVIDER } from '../providers';
import { EventScheduleModel } from '../models';
import { EventScheduleDto } from '../dtos';
import { AdminEventScheduleCreatePayload, AdminEventScheduleUpdatePayload, EventScheduleSearchPayload } from '../payloads';
import { BookEventService } from './book-event.service';

@Injectable()
export class EventService {
  constructor(
    @Inject(EVENT_PROVIDER)
    private readonly eventScheduleModel: Model<EventScheduleModel>,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @Inject(forwardRef(() => MailerService))
    private readonly mailerService: MailerService,
    @Inject(forwardRef(() => BookEventService))
    private readonly bookEventService: BookEventService
  ) {}

  async findOne(id: string | ObjectId): Promise<EventScheduleDto> {
    const schedule = await this.eventScheduleModel.findOne({ _id: id }).lean();
    if (!schedule) {
      throw new EntityNotFoundException();
    }
    const dto = plainToClass(EventScheduleDto, { ...schedule });
    return dto;
  }

  async findById(id: string | ObjectId) {
    return this.eventScheduleModel.findOne({ _id: id });
  }

  async findByIds(Ids: string[] | ObjectId[]) {
    const data = await this.eventScheduleModel.find({ _id: { $in: Ids } });
    return data;
  }

  public async updateAvailability(id: string, price: number): Promise<any> {
    return this.eventScheduleModel.updateOne({ _id: id }, { availability: price });
  }

  public async getDetails(id: string) {
    const schedule = await this.eventScheduleModel.findOne({ _id: id }).lean();
    if (!schedule) {
      throw new EntityNotFoundException();
    }

    const image = schedule.fileId ? await this.fileService.findById(schedule.fileId) : null;
    const dto = new EventScheduleDto(schedule);
    dto.image = image ? image.getUrl() : null;
    return dto;
  }

  public async adminCreate(
    payload: AdminEventScheduleCreatePayload,
    files: FileDto
  ): Promise<EventScheduleDto> {
    if (moment(payload.startAt) < moment()) {
      throw new HttpException('Please choose a future date', HttpStatus.BAD_REQUEST);
    }
    if (moment(payload.startAt) > moment(payload.endAt)) {
      throw new BadRequestException();
    }
    if (payload.isPrivate === true) {
      if (!payload.performerIds) {
        throw new HttpException('Please provide performer', 400);
      }
    }

    const data = { ...payload };
    if (data.isPrivate === false) {
      data.performerIds = [];
    }
    if (files) {
      data.fileId = files?._id;
    } else {
      data.fileId = '';
    }
    const schedule = await this.eventScheduleModel.create(data);

    await this.mailerService.send({
      subject: 'Create Event Successful',
      to: schedule.email,
      data: {
        ...new EventScheduleDto(schedule),
        startDate: payload.startAt,
        endDate: payload.endAt
      },
      template: 'admin-created-event-success'
    });
    return plainToClass(EventScheduleDto, schedule.toObject());
  }

  public async adminUpdate(
    id: string | ObjectId,
    payload: AdminEventScheduleUpdatePayload,
    files: FileDto
  ): Promise<EventScheduleDto> {
    const schedule = await this.findById(id);
    if (!schedule) {
      throw new EntityNotFoundException();
    }

    if (payload.startAt && moment(payload.startAt) < moment()) {
      throw new HttpException('Please choose a future date', HttpStatus.BAD_REQUEST);
    }
    if (payload.startAt && moment(payload.startAt) > moment(payload.endAt)) {
      throw new BadRequestException();
    }
    if (payload.isPrivate === true) {
      if (!payload.performerIds || schedule.performerIds.length <= 0) {
        throw new HttpException('Please provide performer', 400);
      }
    }
    const data = { ...payload };
    const deletedFileIds = [];
    if (files) {
      data.fileId && deletedFileIds.push(data.fileId);
      data.fileId = files?._id;
    }
    if (data.isPrivate === false) {
      schedule.performerIds = [];
    }
    if (data.performerIds) {
      schedule.performerIds = data.performerIds ? data.performerIds : schedule.performerIds;
    }
    schedule.updatedAt = new Date();
    merge(schedule, data);
    await schedule.save();
    deletedFileIds.length
    && (await Promise.all(
      deletedFileIds.map((fileId) => this.fileService.remove(fileId))
    ));
    return plainToClass(EventScheduleDto, schedule.toObject());
  }

  async adminDelete(id: string | ObjectId) {
    const schedule = await this.findById(id);
    if (!schedule) {
      throw new EntityNotFoundException();
    }
    await schedule.remove();
    schedule.fileId
      && (await this.fileService.remove(schedule.fileId));
    return true;
  }

  async search(
    req: EventScheduleSearchPayload
  ): Promise<PageableData<EventScheduleDto>> {
    const query: FilterQuery<EventScheduleModel> = {};
    if (req.q) {
      const searchTerms = req.q.trim().toLowerCase();
      const searchValue = {
        name: { $regex: new RegExp(searchTerms, 'i') }
      };
      query.$and = [searchValue];
    }
    if (req.status) query.status = req.status;
    if (req.isPrivate) query.isPrivate = req.isPrivate;
    if (req.performerId) {
      query.performerIds = { $in: [query.performerId] };
    }
    if (req.startAt && req.endAt) {
      query.startAt = { $gte: moment(req.startAt).startOf('day').toDate() };
      query.endAt = { $lte: moment(req.endAt).endOf('day').toDate() };
    }
    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || 'desc'
    };
    const [schedules, total] = await Promise.all([
      this.eventScheduleModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.eventScheduleModel.countDocuments(query)
    ]);
    const data = schedules.map((s) => new EventScheduleDto(s));
    const images = schedules
      .filter((schedule) => schedule?.fileId && schedule.fileId !== '')
      .map((schedule) => ObjectId(schedule.fileId));

    const imgs = await this.fileService.findByIds(images);
    if (imgs.length) {
      data.forEach((a) => {
        const img = imgs.find(
          (p) => p._id.toString() === a.fileId.toString()
        );
        if (img) {
          // eslint-disable-next-line no-param-reassign
          a.image = {
            img
          };
        }
      });
    }
    return { data, total };
  }

  async performerSearchEvent(
    req: EventScheduleSearchPayload,
    performer: PerformerDto
  ): Promise<PageableData<EventScheduleDto>> {
    const query: FilterQuery<EventScheduleModel> = {};
    if (req.q) {
      const searchTerms = req.q.trim().toLowerCase();
      const searchValue = {
        name: { $regex: new RegExp(searchTerms, 'i') }
      };
      query.$and = [searchValue];
    }
    if (req.status) query.status = req.status;
    if (req.isPrivate) query.isPrivate = req.isPrivate;
    if (req.performerId) {
      query.performerIds = { $in: [query.performerId] };
    }
    if (req.startAt && req.endAt) {
      query.startAt = { $gte: moment(req.startAt).startOf('day').toDate() };
      query.endAt = { $lte: moment(req.endAt).endOf('day').toDate() };
    }
    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || 'desc'
    };
    const [schedules, total] = await Promise.all([
      this.eventScheduleModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.eventScheduleModel.countDocuments(query)
    ]);
    const data = schedules
      .filter((schedule) => {
        if (schedule.isPrivate) {
          return schedule.performerIds.includes(performer._id.toString());
        }
        return true;
      })
      .map((s) => new EventScheduleDto(s));
    const images = schedules
      .filter((schedule) => schedule?.fileId && schedule.fileId !== '')
      .map((schedule) => ObjectId(schedule.fileId));
    const eventIds = data.map((d) => d._id.toString());
    const findEvents = await this.bookEventService.findByEventIds(eventIds, performer._id.toString());
    const imgs = await this.fileService.findByIds(images);
    if (imgs.length) {
      data.forEach((a) => {
        const img = imgs.find(
          (p) => p._id.toString() === a.fileId.toString()
        );
        if (img) {
          // eslint-disable-next-line no-param-reassign
          a.image = {
            img
          };
        }
      });
    }
    if (findEvents.length) {
      data.forEach((a) => {
        const evt = findEvents.find(
          (p) => p.eventId.toString() === a._id.toString()
        );
        // eslint-disable-next-line no-param-reassign
        a.booked = {
          evt
        };
      });
    }
    return { data, total };
  }
}
