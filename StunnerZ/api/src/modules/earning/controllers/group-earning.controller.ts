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
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { PerformerDto } from 'src/modules/performer/dtos';
import { Body, Post } from '@nestjs/common/decorators';
import { GroupEarningService } from '../services/group-earning.service';
import {
  GroupEarningSearchRequestPayload, GroupEarningUpdateStatusPayload
} from '../payloads/group-earning-search.payload';
import { GroupEarningDto, IGroupEarningStatResponse } from '../dtos/group-earning.dto';

@Injectable()
@Controller('group-earning')
export class GroupEarningController {
  constructor(private readonly groupEarningService: GroupEarningService) {}

  @Get('/admin/search')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminSearch(
    @Query() req: GroupEarningSearchRequestPayload
  ): Promise<DataResponse<PageableData<GroupEarningDto>>> {
    const data = await this.groupEarningService.adminSearch(req);
    return DataResponse.ok(data);
  }

  @Get('/performer/search')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async search(
    @Query() req: GroupEarningSearchRequestPayload,
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<PageableData<GroupEarningDto>>> {
    const data = await this.groupEarningService.search(req, performer);
    return DataResponse.ok(data);
  }

  @Get('/sub-performer/search')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async subPerformerSearch(
    @Query() req: GroupEarningSearchRequestPayload
  ): Promise<DataResponse<PageableData<GroupEarningDto>>> {
    const data = await this.groupEarningService.subPerformerSearch(req);
    return DataResponse.ok(data);
  }

  @Get('/admin/stats')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async adminStats(
    @Query() req: GroupEarningSearchRequestPayload
  ): Promise<DataResponse<IGroupEarningStatResponse>> {
    const data = await this.groupEarningService.adminStats(req);
    return DataResponse.ok(data);
  }

  @Get('/performer/stats')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async performerStats(
    @Query() req: GroupEarningSearchRequestPayload,
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<IGroupEarningStatResponse>> {
    req.performerId = performer._id;
    const data = await this.groupEarningService.performerStats(req);
    return DataResponse.ok(data);
  }

  @Get('/sub-performer/stats')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async subPerformerStats(
    @Query() req: GroupEarningSearchRequestPayload
  ): Promise<DataResponse<IGroupEarningStatResponse>> {
    const data = await this.groupEarningService.subPerformerStats(req);
    return DataResponse.ok(data);
  }

  @Post('/admin/update-status')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateGroupEarning(
    @Body() payload: GroupEarningUpdateStatusPayload
  ): Promise<DataResponse<IGroupEarningStatResponse>> {
    const data = await this.groupEarningService.updateStatusGroupEarning(payload);
    return DataResponse.ok(data);
  }
}
