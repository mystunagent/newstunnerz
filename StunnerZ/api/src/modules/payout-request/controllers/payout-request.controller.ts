import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Param,
  Get,
  Post,
  UseGuards,
  Body,
  Put
} from '@nestjs/common';
import { AuthGuard } from 'src/modules/auth/guards';
import { DataResponse } from 'src/kernel';
import { CurrentUser, Privileges } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import { PERFORMER_PRIVILEGES } from 'src/modules/user/constants';
import { PayoutRequestCreatePayload, PayoutRequestPerformerUpdatePayload, SubPayoutRequestCreatePayload, SubPayoutRequestPerformerUpdatePayload } from '../payloads/payout-request.payload';
import { PayoutRequestService } from '../services/payout-request.service';

@Injectable()
@Controller('payout-requests')
export class PayoutRequestController {
  constructor(private readonly payoutRequestService: PayoutRequestService) {}

  @Post('/')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Privileges(PERFORMER_PRIVILEGES.PAYOUT_REQUEST)
  async create(
    @Body() payload: PayoutRequestCreatePayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.requestPayout(payload, user);
    return DataResponse.ok(data);
  }

  @Post('/sub-performer')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Privileges(PERFORMER_PRIVILEGES.PAYOUT_REQUEST)
  async subPerformerCreate(
    @Body() payload: SubPayoutRequestCreatePayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.subPerformerRequestPayout(payload);
    return DataResponse.ok(data);
  }

  @Post('/calculate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Privileges(PERFORMER_PRIVILEGES.PAYOUT_REQUEST)
  async calculate(
    @Body() payload: { sourceId: string },
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.calculate(user, payload);
    return DataResponse.ok(data);
  }

  @Post('/user/calculate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async ucalculate(
    @Body() payload: { sourceId: string },
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.userCalculate(user, payload);
    return DataResponse.ok(data);
  }

  @Post('/sub-performer/calculate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async subPerformerCalculate(
    @Body() payload: { sourceId: string },
    @CurrentUser() user: any
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.subPerformerCalculate(user, payload);
    return DataResponse.ok(data);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Privileges(PERFORMER_PRIVILEGES.PAYOUT_REQUEST)
  async update(
    @Param('id') id: string,
    @Body() payload: PayoutRequestPerformerUpdatePayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.updatePayout(id, payload, user);
    return DataResponse.ok(data);
  }

  @Put('/:id/sub-performer')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Privileges(PERFORMER_PRIVILEGES.PAYOUT_REQUEST)
  async subUpdate(
    @Param('id') id: string,
    @Body() payload: SubPayoutRequestPerformerUpdatePayload
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.subUpdatePayout(id, payload);
    return DataResponse.ok(data);
  }

  @Get('/:id/view')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Privileges(PERFORMER_PRIVILEGES.PAYOUT_REQUEST)
  async details(
    @Param('id') id: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.details(id, user);
    return DataResponse.ok(data);
  }

  @Post('/:id/sub-performer/view')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Privileges(PERFORMER_PRIVILEGES.PAYOUT_REQUEST)
  async subDetails(
    @Param('id') id: string,
    @Body('sourceId') sourceId: string
  ): Promise<DataResponse<any>> {
    const data = await this.payoutRequestService.subDetails(id, sourceId);
    return DataResponse.ok(data);
  }
}
