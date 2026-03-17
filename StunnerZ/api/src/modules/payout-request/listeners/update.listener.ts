import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { MailerService } from 'src/modules/mailer';
import { PayoutRequestDto } from '../dtos/payout-request.dto';
import {
  PAYOUT_REQUEST_CHANEL,
  PAYOUT_REQUEST_EVENT,
  PAYOUT_REQUEST_SUB_CHANEL,
  SOURCE_TYPE,
  STATUSES
} from '../constants';
import { UserService } from 'src/modules/user/services';

const PAYOUT_REQUEST_UPDATE = 'PAYOUT_REQUEST_UPDATE';
const PAYOUT_REQUEST_SUB_UPDATE = 'PAYOUT_REQUEST_SUB_UPDATE';

@Injectable()
export class UpdatePayoutRequestListener {
  constructor(
    @Inject(forwardRef(() => QueueEventService))
    private readonly queueEventService: QueueEventService,
    @Inject(forwardRef(() => MailerService))
    private readonly mailService: MailerService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) {
    this.queueEventService.subscribe(
      PAYOUT_REQUEST_CHANEL,
      PAYOUT_REQUEST_UPDATE,
      this.handler.bind(this)
    );
    this.queueEventService.subscribe(
      PAYOUT_REQUEST_SUB_CHANEL,
      PAYOUT_REQUEST_SUB_UPDATE,
      this.handleSub.bind(this)
    );
  }

  async handler(event: QueueEvent) {
    const request = event.data.request as PayoutRequestDto;
    const { source } = request;
    if (event.eventName === PAYOUT_REQUEST_EVENT.UPDATED) {
      if (source === SOURCE_TYPE.PERFORMER) {
        await this.handlePerformer(request, event.data.oldStatus);
      }
    }
  }

  private async handlePerformer(request, oldStatus) {
    const {
      status, sourceId, requestTokens
    } = request;
    const sourceInfo = await this.performerService.findById(sourceId);
    if (!sourceInfo) {
      return;
    }
    if (status === STATUSES.DONE && oldStatus === STATUSES.PENDING) {
      await this.performerService.updatePerformerBalance(sourceId, -requestTokens);
    }

    if (sourceInfo.email) {
      await this.mailService.send({
        subject: 'Update payout request',
        to: sourceInfo.email,
        data: { request },
        template: 'payout-request-status'
      });
    }
  }

  async handleSub(event: QueueEvent) {
    const request = event.data.request as PayoutRequestDto;
    const { source } = request;
    if (event.eventName === PAYOUT_REQUEST_EVENT.UPDATED) {
      if (source === SOURCE_TYPE.SUB_PERFORMER) {
        await this.handleSubPerformer(request, event.data.oldStatus);
      }
    }
  }

  private async handleSubPerformer(request, oldStatus) {
    const {
      status, sourceId, requestTokens
    } = request;
    const sourceInfo = await this.userService.findById(sourceId);
    if (!sourceInfo) {
      return;
    }
    if (status === STATUSES.DONE && oldStatus === STATUSES.PENDING) {
      await this.userService.updateBalance(sourceId, -requestTokens);
    }

    if (sourceInfo.email) {
      await this.mailService.send({
        subject: 'Update payout request',
        to: sourceInfo.email,
        data: { request },
        template: 'payout-request-status'
      });
    }
  }
}
