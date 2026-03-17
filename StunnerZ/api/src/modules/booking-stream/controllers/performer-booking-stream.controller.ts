import {
  Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards, UsePipes, ValidationPipe
} from '@nestjs/common';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Privileges, Roles } from 'src/modules/auth';
import { RoleGuard } from 'src/modules/auth/guards';
import { PerformerDto } from 'src/modules/performer/dtos';
import { PERFORMER_PRIVILEGES } from 'src/modules/user/constants';
import { PerformerBookingSearchPayload } from '../payloads';
import { BookingStreamDto } from '../dtos';
import { PerformerBookingStreamService } from '../services';

@Controller('/performer-book-stream')
export class PerformerBookingStreamController {
  constructor(private readonly service: PerformerBookingStreamService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  @Privileges(PERFORMER_PRIVILEGES.BOOKING_STREAM)
  async search(
    @Query() payload: PerformerBookingSearchPayload,
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<PageableData<Partial<BookingStreamDto>>>> {
    const query = {
      ...payload,
      performerId: performer._id.toString()
    };
    const result = await this.service.search(query);
    return DataResponse.ok(result);
  }

  @Get('/upcoming')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async searchUpcoming(
    @Query() payload: PerformerBookingSearchPayload
  ): Promise<DataResponse<PageableData<Partial<BookingStreamDto>>>> {
    const result = await this.service.search(payload);
    return DataResponse.ok(result);
  }

  @Post('/:id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  @Privileges(PERFORMER_PRIVILEGES.BOOKING_STREAM)
  async approve(
    @Param('id') id: string,
    @CurrentUser() currentUser: PerformerDto
  ): Promise<DataResponse<any>> {
    await this.service.approve(id, currentUser);
    return DataResponse.ok({ success: true });
  }

  @Post('/:id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  @Privileges(PERFORMER_PRIVILEGES.BOOKING_STREAM)
  async reject(
    @Param('id') id: string,
    @CurrentUser() currentUser: PerformerDto
  ): Promise<DataResponse<any>> {
    await this.service.reject(id, currentUser);
    return DataResponse.ok({ success: true });
  }
}
