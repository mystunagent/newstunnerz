import { forwardRef, HttpException, Inject, Injectable } from '@nestjs/common';
import { FilterQuery, Model, ObjectId } from 'mongoose';
import { PerformerDto } from 'src/modules/performer/dtos';
import * as moment from 'moment';
import { EntityNotFoundException, PageableData } from 'src/kernel';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { SET_TIME_BOOKING_STREAM_PROVIDER } from '../constants';
import { SetUpTimeStreamModel } from '../models';
import { CreateSetupTimeStreamPayload, SetUpTimeStreamSearchPayload, UpdateSetupTimeStreamPayload } from '../payloads';
import { InvalidDateRangerException } from '../exceptions';
import { SetUpTimeStreamDto } from '../dtos';
import { UpcomingStreamService } from './upcoming-stream.service';

@Injectable()
export class SetUpTimeStreamService {
  constructor(
    @Inject(SET_TIME_BOOKING_STREAM_PROVIDER)
    private readonly setupTimeStreamModel: Model<SetUpTimeStreamModel>,
    @Inject(forwardRef(() => UpcomingStreamService))
    private readonly upcomingStreamService: UpcomingStreamService
  ) {}

  public findById(id: string | ObjectId) {
    return this.setupTimeStreamModel.findById(id);
  }

  public findByIds(ids: string[] | ObjectId[]) {
    return this.setupTimeStreamModel.find({ _id: { $in: ids } });
  }

  public checkIsValidDateRanger(startAt: Date, endAt: Date) {
    return moment(startAt).isAfter(moment()) && moment(endAt).isAfter(startAt);
  }

  public async checkIfExpired(startAt: Date) {
    return moment().isAfter(moment(startAt));
  }

  public checkIfExisted(
    startAt: Date,
    endAt: Date,
    performerId: string
  ) {
    return this.setupTimeStreamModel.countDocuments({
      performerId,
      $or: [
        {
          startAt: { $lte: moment(endAt).toDate() },
          endAt: { $gte: moment(endAt).toDate() }
        },
        {
          startAt: { $lte: moment(startAt).toDate() },
          endAt: { $gte: moment(startAt).toDate() }
        },
        {
          startAt: { $gte: moment(startAt).toDate() },
          endAt: { $lte: moment(endAt).toDate() }
        }
      ]
    });
  }

  public async updateOne(id: string, payload: any) {
    const result = await this.setupTimeStreamModel.updateOne({ _id: id.toString() }, payload);
    return result;
  }

  public async create(payload: CreateSetupTimeStreamPayload, performer: PerformerDto) {
    const { startAt, endAt } = payload;
    if (!this.checkIsValidDateRanger(startAt, endAt)) {
      throw new InvalidDateRangerException();
    }

    if (!this.checkIfExpired(startAt)) {
      throw new HttpException('Please select a start date greater than the current time', 400);
    }

    const diffInMinutes = moment(new Date(endAt).setSeconds(0)).diff(moment(new Date(startAt).setSeconds(0)), 'minutes');

    if (Number(diffInMinutes) < 5) {
      throw new HttpException('Please set a minimum of 5 minutes', 400);
    }

    const checkExistDate = await this.checkIfExisted(startAt, endAt, performer._id.toString());

    if (checkExistDate) {
      throw new HttpException('Please choose different date, this date exists', 400);
    }

    const checkExistUpcoming = await this.upcomingStreamService.checkIfExisted(
      performer._id,
      startAt,
      endAt
    )

    if (checkExistUpcoming) {
      throw new HttpException('Your schedule is not available for the selected time', 400);
    }

    const result = await this.setupTimeStreamModel.create({
      performerId: performer._id,
      startAt: new Date(startAt).setSeconds(0),
      endAt: new Date(endAt).setSeconds(0)
    });

    return result;
  }

  public async update(id: string, payload: UpdateSetupTimeStreamPayload) {
    const appointment = await this.setupTimeStreamModel.findById(id);
    if (!appointment) {
      throw new EntityNotFoundException();
    }

    const { endAt, startAt, status } = payload;
    if (!this.checkIsValidDateRanger(startAt, endAt)) {
      throw new InvalidDateRangerException();
    }
    const checkExistUpcoming = await this.upcomingStreamService.checkIfExisted(
      appointment.performerId,
      startAt,
      endAt
    )

    if (checkExistUpcoming) {
      throw new HttpException('Your schedule is not available for the selected time', 400);
    }
    return this.setupTimeStreamModel.updateOne(
      {
        _id: id
      },
      {
        $set: {
          startAt: new Date(startAt).setSeconds(0),
          endAt: new Date(endAt).setSeconds(0),
          status,
          updatedAt: new Date()
        }
      }
    );
  }

  async getDetail(id: string) {
    const data = await this.setupTimeStreamModel.findById(id);
    if (!data) {
      throw new EntityNotFoundException();
    }
    const result = new SetUpTimeStreamDto(data);
    return result;
  }

  async delete(id: string | ObjectId) {
    const appointment = await this.setupTimeStreamModel.findById(id);
    if (!appointment) {
      throw new EntityNotFoundException();
    }

    return this.setupTimeStreamModel.deleteOne({ _id: id });
  }

  async search(
    req: SetUpTimeStreamSearchPayload
  ): Promise<PageableData<Partial<SetUpTimeStreamDto>>> {
    const query: FilterQuery<SetUpTimeStreamModel> = {};
    if (req.performerId) query.performerId = toObjectId(req.performerId);
    if (req.status && req.status !== 'expired') {
      query.status = req.status;
      query.startAt = { $gte: new Date() };
    } else if (req.status && req.status === 'expired') {
      query.startAt = { $lt: new Date() };
    }

    if (req.startAt && req.endAt) {
      query.startAt = { $gte: moment(req.startAt).startOf('day').toDate() };
      query.endAt = { $lte: moment(req.endAt).endOf('day').toDate() };
    }

    if (req.startAt) {
      query.startAt = { $gte: moment(req.startAt).startOf('day').toDate() };
    }

    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || 'desc'
    };

    const [data, total] = await Promise.all([
      this.setupTimeStreamModel.find(query)
        .sort(sort)
        .limit(parseInt(req.limit as string, 10))
        .skip(parseInt(req.offset as string, 10))
        .exec(),
      this.setupTimeStreamModel.countDocuments(query)
    ]);
    const result = data.map((d) => new SetUpTimeStreamDto(d));
    return {
      total,
      data: result
    };
  }
}
