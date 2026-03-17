import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
  UseGuards,
  Query
} from '@nestjs/common';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Privileges, Roles } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import { PERFORMER_PRIVILEGES } from 'src/modules/user/constants';
import { PayoutRequestService } from '../services/payout-request.service';
import { PayoutRequestDto } from '../dtos/payout-request.dto';
import { PayoutRequestSearchPayload } from '../payloads/payout-request.payload';
import { SOURCE_TYPE } from '../constants';

@Injectable()
@Controller('payout-requests')
export class PayoutRequestSearchController {
  constructor(
    private readonly payoutRequestService: PayoutRequestService
  ) {}

  @Get('/search')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminSearch(
    @Query() req: PayoutRequestSearchPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<PayoutRequestDto>>> {
    const data = await this.payoutRequestService.search(req, user);
    return DataResponse.ok(data);
  }

  @Get('/user/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Privileges(PERFORMER_PRIVILEGES.PAYOUT_REQUEST)
  async performerSearch(
    @Query() req: PayoutRequestSearchPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<PayoutRequestDto>>> {
    req.sourceId = user._id;
    req.source = user.isPerformer ? SOURCE_TYPE.PERFORMER : SOURCE_TYPE.USER;
    const data = await this.payoutRequestService.search(req);
    return DataResponse.ok(data);
  }

  @Get('/sub-performer/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async subPerformerSearch(
    @Query() req: PayoutRequestSearchPayload,
    @CurrentUser() user: any
  ): Promise<DataResponse<PageableData<PayoutRequestDto>>> {
    req.source = SOURCE_TYPE.SUB_PERFORMER;
    const data = await this.payoutRequestService.searchSubPerformer(req, user);
    return DataResponse.ok(data);
  }
}
