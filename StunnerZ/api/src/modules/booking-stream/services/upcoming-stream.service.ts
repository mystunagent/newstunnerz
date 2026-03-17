import {
  forwardRef, HttpException, Inject, Injectable
} from '@nestjs/common';
import { FilterQuery, Model, ObjectId } from 'mongoose';
import { PerformerService } from 'src/modules/performer/services';
import { PerformerDto } from 'src/modules/performer/dtos';
import * as moment from 'moment';
import { AgendaService, EntityNotFoundException, PageableData } from 'src/kernel';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { UserService } from 'src/modules/user/services';
import { SubscriptionService } from 'src/modules/subscription/services/subscription.service';
import { SubscriptionDto } from 'src/modules/subscription/dtos/subscription.dto';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { UserDto } from 'src/modules/user/dtos';
import { SCHEDULE_UPCOMING_AGENDA, UPCOMING_STREAM_PROVIDER } from '../constants';
import { UpcomingStreamModel } from '../models';
import { CreateUpcomingStreamPayload, UpcomingStreamSearchPayload, UpdateUpcomingStreamPayload } from '../payloads';
import { InvalidDateRangerException } from '../exceptions';
import { UpcomingStreamDto } from '../dtos';
import { SetUpTimeStreamService } from './setup-time-stream.service';

@Injectable()
export class UpcomingStreamService {
  constructor(
  @Inject(UPCOMING_STREAM_PROVIDER)
    private readonly upcomingStreamModel: Model<UpcomingStreamModel>,
    @Inject(forwardRef(() => SetUpTimeStreamService))
    private readonly setUpTimeStreamService: SetUpTimeStreamService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(forwardRef(() => AgendaService))
    private readonly agendaService: AgendaService,
    @Inject(forwardRef(() => SocketUserService))
    private readonly socketUserService: SocketUserService
  ) {
    this.defineJobs();
  }

  private async scheduleUpcomingStreamJob(upcomingStream: any) {
    if(!!upcomingStream) {
      const startAt = new Date(upcomingStream.startAt);
      const now = new Date();
      const timeBeforeStreamStart = moment(startAt).isAfter(now);
      if (timeBeforeStreamStart) {
        await this.agendaService.schedule(new Date(new Date(upcomingStream.startAt).setMinutes(new Date(upcomingStream.startAt).getMinutes() - 15)), SCHEDULE_UPCOMING_AGENDA, {
          upcomingStream
        });
      }
    }
  }

  private async defineJobs() {
    const collection = (this.agendaService as any)._collection;
    await collection.deleteMany({
      name: {
        $in: [SCHEDULE_UPCOMING_AGENDA]
      }
    });
    this.agendaService.define(SCHEDULE_UPCOMING_AGENDA, {}, this.scheduleUpcomingStream.bind(this));
    const upcomingStream = await this.upcomingStreamModel.find({
      startAt: { $gte: moment().startOf('day').toDate() }
    }).lean();
    if (upcomingStream.length > 0) {
      await Promise.all(
        upcomingStream.map(async (stream) => {
          await this.scheduleUpcomingStreamJob(stream);
        })
      );
    }
  }

  private async scheduleUpcomingStream(job: any, done: any) {
    try {
      const { upcomingStream } = job.attrs.data;

      const upcoming = new UpcomingStreamDto(upcomingStream);
      const performer = await this.performerService.findById(upcoming.performerId);

      try {
        const listSub = await this.subscriptionService.findSubscriptionList({ performerId: upcoming.performerId.toString() });
        const subs = listSub.map((sub) => new SubscriptionDto(sub));
        const userSubs = subs.map((l) => l.userId);
        const users = await this.userService.findByIds(userSubs);

        // send to performer
        await this.socketUserService.emitToUsers(performer._id.toString(), 'schedule_upcoming_stream', upcoming);

        await Promise.all(
          users.map(async (user) => {
            await this.socketUserService.emitToUsers(user._id.toString(), 'schedule_upcoming_stream', {
              ...upcoming,
              performerInfo: new PerformerDto(performer).toSearchResponse()
            });
          })
        );
      } catch (error) {
        console.error('Error upcoming schedule:', error);
      }
    } catch (e) {
      console.log('Schedule upcoming error', e);
    } finally {
      job.remove();
      // Only reschedule if there are upcoming streams
      const upcomingStream = await this.upcomingStreamModel.find({
        startAt: { $gte: moment().startOf('day').toDate() }
      }).lean();
      if (upcomingStream.length > 0) {
        this.agendaService.schedule('5 seconds from now', SCHEDULE_UPCOMING_AGENDA, {});
      }
      typeof done === 'function' && done();
    }
  }

  public static checkIsValidDateRanger(startAt: Date, endAt: Date) {
    return moment(startAt).isAfter(moment()) && moment(endAt).isAfter(startAt);
  }

  public checkIfExisted(
    performerId: string | ObjectId,
    startAt: Date,
    endAt: Date,
    excludedId?: string | ObjectId
  ) {
    const query: any = {
      performerId,
      $or: [
        {
          startAt: { $lte: moment(endAt).toDate() },
          endAt: { $gte: moment(endAt).toDate() }
        },
        {
          startAt: { $lte: moment(startAt).toDate() },
          endAt: { $gte: moment(startAt).toDate() }
        }
      ]
    };

    if (excludedId) {
      query._id = { $ne: excludedId };
    }

    return this.upcomingStreamModel.countDocuments(query);
  }

  public async updateStatus(id: string, status: string) {
    const data = await this.upcomingStreamModel.updateOne({ _id: id }, { status });
    return data;
  }

  public static checkIfExpired(startAt: Date) {
    return moment().isAfter(moment(startAt));
  }

  
  public findById(id: string | ObjectId) {
    return this.upcomingStreamModel.findById(id);
  }

  public async findOne(params) {
    const schedule = await this.upcomingStreamModel.findOne(params).lean();
    if (!schedule) {
      throw new EntityNotFoundException();
    }

    return schedule;
  }

  public findByIds(ids: string[] | ObjectId[]) {
    return this.upcomingStreamModel.find({ _id: { $in: ids } });
  }

  async viewDetails(id: string) {
    const appointment = await this.upcomingStreamModel.findById(id);
    if (!appointment) {
      throw new EntityNotFoundException();
    }

    return new UpcomingStreamDto(appointment);
  }

  async create(payload: CreateUpcomingStreamPayload, performer: PerformerDto) {
    const { startAt, endAt } = payload;
    if (!UpcomingStreamService.checkIsValidDateRanger(startAt, endAt)) {
      throw new InvalidDateRangerException();
    }

    const checkExisted = await this.checkIfExisted(
      performer._id,
      startAt,
      endAt
    );

    if (checkExisted) {
      throw new HttpException('Time exists', 400);
    }

    const checkExistSetupTime = await this.setUpTimeStreamService.checkIfExisted(startAt, endAt, performer._id.toString());

    if (checkExistSetupTime) {
      throw new HttpException('Your schedule is not available for the selected time', 400);
    }

    const result = await this.upcomingStreamModel.create({
      ...payload,
      performerId: performer._id,
      startAt: new Date(startAt).setSeconds(0),
      endAt: new Date(endAt).setSeconds(0),
    });

    await this.scheduleUpcomingStreamJob({
      ...result.toObject()
    });
    return result;
  }

  async update(
    id: string | ObjectId,
    payload: UpdateUpcomingStreamPayload,
    currentUser: PerformerDto
  ) {
    const appointment = await this.upcomingStreamModel.findById(id);
    if (!appointment) {
      throw new EntityNotFoundException();
    }

    const { endAt, startAt } = payload;

    if (!UpcomingStreamService.checkIsValidDateRanger(startAt, endAt)) {
      throw new InvalidDateRangerException();
    }

    const checkExisted = await this.checkIfExisted(
      currentUser._id,
      startAt,
      endAt,
      id
    );
    if (checkExisted) {
      throw new HttpException('Cannot create session as there is another session booked at the same time', 400);
    }

    const checkExistSetupTime = await this.setUpTimeStreamService.checkIfExisted(startAt, endAt, appointment.performerId.toString());

    if (checkExistSetupTime) {
      throw new HttpException('Your schedule is not available for the selected time', 400);
    }

    return this.upcomingStreamModel.updateOne(
      {
        _id: id
      },
      {
        $set: {
          ...payload,
          description: '',
          startAt: new Date(startAt).setSeconds(0),
          endAt: new Date(endAt).setSeconds(0),
          updatedAt: new Date()
        }
      }
    );
  }

  async delete(id: string | ObjectId) {
    const appointment = await this.upcomingStreamModel.findById(id);
    if (!appointment) {
      throw new EntityNotFoundException();
    }

    return this.upcomingStreamModel.deleteOne({ _id: id });
  }

  async search(
    req: UpcomingStreamSearchPayload,
    user?: UserDto
  ): Promise<PageableData<Partial<UpcomingStreamDto>>> {
    const query: FilterQuery<UpcomingStreamModel> = {};
    if (req.performerId) query.performerId = toObjectId(req.performerId);

    if (req.startAt && req.endAt) {
      query.startAt = { $gte: moment(req.startAt).startOf('day').toDate() };
      query.endAt = { $lte: moment(req.endAt).endOf('day').toDate() };
    }

    if (req.status) {
      query.status = req.status;
    }

    const sort = {
      [req.sortBy || 'updatedAt']: req.sort || 'desc'
    };

    const [schedules, total] = await Promise.all([
      this.upcomingStreamModel.find(query)
        .sort(sort)
        .limit(parseInt(req.limit as string, 10))
        .skip(parseInt(req.offset as string, 10))
        .exec(),
      this.upcomingStreamModel.countDocuments(query)
    ]);
    const data = schedules.map((d) => new UpcomingStreamDto(d));
    const performerIds = data.map((a) => a.performerId);
    const performers = await this.performerService.findByIds(performerIds);
    const subscriptions = user
      ? await this.subscriptionService.findSubscriptionList({
        performerId: { $in: performerIds },
        userId: user._id,
        expiredAt: { $gt: new Date() }
      })
      : [];

    data.forEach((a) => {
      const performer = performers.find(
        (p) => p._id.toString() === a.performerId.toString()
      );
      if (performers.length) {
        if (performer) {
          // eslint-disable-next-line no-param-reassign
          a.performerInfo = {
            ...performer.toSearchResponse()
          };
        }
      }
      const subscription = subscriptions.find(
        (s) => `${s.performerId}` === `${a.performerId}`
      );
      if (subscription) {
        // eslint-disable-next-line no-param-reassign
        a.isSubscribed = !!subscription;
      }
    });

    return {
      total,
      data
    };
  }
}
