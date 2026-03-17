import {
  Body,
  Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards, UsePipes, ValidationPipe
} from '@nestjs/common';
import { DataResponse, PageableData } from 'src/kernel';
import { Roles, CurrentUser, Privileges } from 'src/modules/auth';
import { RoleGuard } from 'src/modules/auth/guards';
import { PerformerDto } from 'src/modules/performer/dtos';
import { PERFORMER_PRIVILEGES } from 'src/modules/user/constants';
import { EventService } from '../services';
import { EventScheduleDto } from '../dtos';
import { BookEventScheduleSearchPayload, EventScheduleSearchPayload } from '../payloads';
import { STATUS } from '../constants';
import { BookEventService } from '../services/book-event.service';

@Controller('events')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly bookEventService: BookEventService
  ) {}

  @Get('/search')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async userSearch(
    @Query() req: EventScheduleSearchPayload,
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<PageableData<EventScheduleDto>>> {
    const query = { ...req, status: STATUS.ACTIVE };
    const data = await this.eventService.performerSearchEvent(query, performer);
    return DataResponse.ok(data);
  }

  @Post('/performer-book')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Privileges(PERFORMER_PRIVILEGES.EVENTS)
  async performerBookEvent(
    @Body('id') id: string,
    @CurrentUser() performer: PerformerDto
  ) {
    const data = await this.bookEventService.performerBookEvent(id.toString(), performer);
    return DataResponse.ok(data);
  }

  @Get('/performer-book/search')
  @Roles('performer')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Privileges(PERFORMER_PRIVILEGES.EVENTS)
  async performerSearchBookEvent(
    @Query() query: BookEventScheduleSearchPayload,
    @CurrentUser() performer: PerformerDto
  ) {
    const req = { ...query, performerId: performer._id };
    const data = await this.bookEventService.search(req);
    return DataResponse.ok(data);
  }

  @Get('/:id/view')
  @UsePipes(new ValidationPipe({ transform: true }))
  async details(
    @Param('id') id: string
  ): Promise<DataResponse<EventScheduleDto>> {
    const result = await this.eventService.getDetails(id);
    return DataResponse.ok(result);
  }

  @Delete('/all')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async deleteAllBook() {
    const result = await this.bookEventService.deleteAll();
    return DataResponse.ok(result);
  }
}
