import {
  Injectable, Logger, forwardRef, Inject
} from '@nestjs/common';
import { AgendaService } from 'src/kernel';
import { MailerService } from 'src/modules/mailer';
import { PerformerService } from 'src/modules/performer/services';
import * as Agenda from 'agenda';
import { UserService } from 'src/modules/user/services';
import { BookingStreamService } from './booking-stream.service';
import { BOOKING_STREAM_CONFIRMATION, BOOKING_STREAM_REMINDER, formatDateNotSecond } from '../constants';

@Injectable()
export class BookingStreamTaskService {
	private logger = new Logger(BookingStreamTaskService.name);

	constructor(
		private readonly agendaService: AgendaService,
		private readonly mailerService: MailerService,
    @Inject(forwardRef(() => PerformerService))
		private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
		private readonly userService: UserService,
		private readonly bookingStreamService: BookingStreamService
	) {
	  this.agendaService.define(
	    BOOKING_STREAM_REMINDER,
	    this.remind.bind(this)
	  );
	  this.agendaService.define(
	    BOOKING_STREAM_CONFIRMATION,
	    this.confirm.bind(this)
	  );
	}

	private async remind(job: Agenda.Job) {
	  try {
	    const { id } = job.attrs.data;
	    const result = await this.bookingStreamService.findById(id);
	    if (!result) return;

	    const {
	      performerId, startAt, status, userId
	    } = result;
	    if (status !== 'approved') return;

	    const performer = await this.performerService.findById(performerId);
	    const user = await this.userService.findById(userId);

	    await this.mailerService.send({
	      to: performer.email,
	      template: 'booking-stream-reminder',
	      subject: 'Booking Stream Reminder',
	      data: {
	        date: formatDateNotSecond(startAt),
	        usernamePerformer: performer.username,
	        usernameUser: user.username
	      }
	    });
	  } catch (e) {
	    this.logger.error(e);
	  }
	}

	private async confirm(job: Agenda.Job) {
	  try {
	    const { id } = job.attrs.data;
	    const result = await this.bookingStreamService.findById(id);
	    if (!result) return;

	    const {
	      performerId, startAt, status, endAt, userId
	    } = result;
	    if (status !== 'pending') return;

	    const performer = await this.performerService.findById(performerId);
	    const user = await this.userService.findById(userId);

	    await this.mailerService.send({
	      to: user.email,
	      template: 'booking-stream-confirmation',
	      subject: 'Booking Stream Confirmation',
	      data: {
	        startAt: formatDateNotSecond(startAt),
	        endAt: formatDateNotSecond(endAt),
	        usernamePerformer: performer.username,
	        usernameUser: user.username,
	        url: ''
	      }
	    });
	  } catch (e) {
	    this.logger.error(e);
	  }
	}
}
