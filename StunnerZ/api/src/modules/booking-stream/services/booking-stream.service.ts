import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import * as moment from 'moment';
import { ObjectId } from 'mongodb';
import { BOOKING_STREAM_PROVIDER } from '../constants';
import { BookingStreamModel } from '../models';
import { BookingStatus } from '../interfaces';
import { BookingStreamDto } from '../dtos';

@Injectable()
export class BookingStreamService {
  constructor(
    @Inject(BOOKING_STREAM_PROVIDER)
    private readonly bookingStreamModel: Model<BookingStreamModel>
  ) {}

  public findById(id: string | ObjectId) {
    return this.bookingStreamModel.findById(id);
  }

  public async findOne(params) {
    const booking = await this.bookingStreamModel.findOne(params);
    if (booking) {
      return new BookingStreamDto(booking)
    }
  }

  public findByIds(ids: string[] | ObjectId[]) {
    return this.bookingStreamModel.find({ _id: { $in: ids } });
  }

  public updateConversation(
    id: string | ObjectId,
    conversationId: string | ObjectId
  ) {
    return this.bookingStreamModel.updateOne(
      { _id: id },
      { $set: { conversationId } }
    );
  }

  public static checkIsValidDateRanger(startAt: Date, endAt: Date) {
    return moment(startAt).isAfter(moment()) && moment(endAt).isAfter(startAt);
  }

  public checkIfExisted(
    performerId: string | ObjectId,
    userId: string | ObjectId,
    startAt: Date,
    endAt: Date,
    status: BookingStatus
  ) {
    return this.bookingStreamModel.countDocuments({
      performerId,
      userId,
      status,
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
    });
  }

  public async checkIfExistedPerformer(
    userId: string | ObjectId,
    startAt: Date,
    endAt: Date
  ): Promise<boolean> {
    const existingBookings = await this.bookingStreamModel.countDocuments({
      userId,
      status: { $in: ['pending', 'approved', 'completed'] },
      $or: [
        {
          startAt: { $lt: endAt },
          endAt: { $gt: startAt }
        }
      ]
    });
  
    return existingBookings > 0;
  }

  public checkIfExistedApprovePerformer(
    performerId: string | ObjectId,
    startAt: Date,
    endAt: Date,
    status: BookingStatus
  ) {
    return this.bookingStreamModel.countDocuments({
      performerId,
      status,
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
    });
  }

  public static checkIfExpired(startAt: Date) {
    return moment().isAfter(moment(startAt));
  }
}
