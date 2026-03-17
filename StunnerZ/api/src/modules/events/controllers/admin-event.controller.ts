import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards, UseInterceptors, UsePipes, ValidationPipe
} from '@nestjs/common';
import { DataResponse, getConfig, PageableData } from 'src/kernel';
import { CurrentUser, Roles } from 'src/modules/auth';
import { RoleGuard } from 'src/modules/auth/guards';
import { PerformerDto } from 'src/modules/performer/dtos';
import { FileDto, FilesUploaded, FileUploadInterceptor, MultiFileUploadInterceptor } from 'src/modules/file';
import { S3ObjectCannelACL, Storage } from 'src/modules/storage/contants';
import { EventService } from '../services';
import { EventScheduleDto } from '../dtos';
import {
  AdminBookEventScheduleSearchPayload, AdminEventScheduleCreatePayload, AdminEventScheduleUpdatePayload, EventScheduleSearchPayload
} from '../payloads';
import { BookEventService } from '../services/book-event.service';

@Controller('admin/events')
export class AdminEventController {
  constructor(
    private readonly eventService: EventService,
    private readonly bookEventService: BookEventService
  ) {}

  @Post('/')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(
    MultiFileUploadInterceptor([
      {
      type: 'event-image',
      fieldName: 'image',
      options: {
      destination: getConfig('file').imageDir,
      generateThumbnail: true,
      uploadImmediately: true,
      thumbnailSize: getConfig('image').originThumbnail,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
      }
      }
      ])
  )
  async create(
    @Body() payload: AdminEventScheduleCreatePayload,
    @FilesUploaded() files: Record<string, any>
  ): Promise<DataResponse<EventScheduleDto>> {
    const result = await this.eventService.adminCreate(payload, files.image);
    return DataResponse.ok(result);
  }

  @Get('')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async search(
    @Query() query: EventScheduleSearchPayload
  ): Promise<DataResponse<PageableData<EventScheduleDto>>> {
    const data = await this.eventService.search(query);
    return DataResponse.ok(data);
  }

  @Get('/performer-book/search')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async performerSearchBookEvent(
    @Query() query: AdminBookEventScheduleSearchPayload
  ) {
    const data = await this.bookEventService.adminSearch(query);
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

  @Put('/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  @UseInterceptors(
    MultiFileUploadInterceptor([
      {
      type: 'event-image',
      fieldName: 'image',
      options: {
      destination: getConfig('file').imageDir,
      generateThumbnail: true,
      uploadImmediately: true,
      thumbnailSize: getConfig('image').originThumbnail,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
      }
      }
      ])
  )
  async update(
    @Param('id') id: string,
    @Body() payload: AdminEventScheduleUpdatePayload,
    @FilesUploaded() files: Record<string, any>
  ): Promise<DataResponse<EventScheduleDto>> {
    const result = await this.eventService.adminUpdate(id, payload, files.image);
    return DataResponse.ok(result);
  }

  @Delete('/:id')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async delete(
    @Param('id') id: string
  ) {
    const result = await this.eventService.adminDelete(id);
    return DataResponse.ok(result);
  }

  @Post('/booking/approved')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async approved(
    @Body('id') id: string
  ) {
    const result = await this.bookEventService.adminApprove(id);
    return DataResponse.ok(result);
  }

  @Post('/booking/rejected')
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async rejected(
    @Body('id') id: string
  ) {
    const result = await this.bookEventService.adminRejected(id);
    return DataResponse.ok(result);
  }
}
