import {
  Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards, UsePipes, ValidationPipe
} from '@nestjs/common';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser } from 'src/modules/auth';
import { AuthGuard, LoadUser } from 'src/modules/auth/guards';
import { UserDto } from 'src/modules/user/dtos';
import { BookingStreamService, UserBookingStreamService } from '../services';
import { CreateBookingPayload, UserBookingSearchPayload } from '../payloads';
import { BookingStreamDto } from '../dtos';

@Controller('/user-book-stream')
export class UserBookingStreamController {
  constructor(
    private readonly userBookingStreamService: UserBookingStreamService,
    private readonly bookingStreamService: BookingStreamService
  ) {}

  @Post('/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async request(
    @Body() payload: CreateBookingPayload,
    @Param('id') performerId: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<Partial<BookingStreamDto>>> {
    const result = await this.userBookingStreamService.request(payload, performerId, user);
    return DataResponse.ok(result);
  }

  // @Put('/:id')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(AuthGuard)
  // @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  // async update(
  //   @Param('id') id: string,
  //   @Body() payload: UpdateBookingPayload,
  //   @CurrentUser() user: UserDto
  // ): Promise<DataResponse<Partial<BookingStreamDto>>> {
  //   await this.userBookingStreamService.update(id, payload, user);
  //   const result = await this.bookingStreamService.findById(id);
  //   return DataResponse.ok(new BookingStreamDto(result).toResponse());
  // }

  // @Delete(':/id')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(AuthGuard)
  // async delete(@Param('id') id: string, @CurrentUser() user: UserDto) {
  //   await this.userBookingStreamService.delete(id, user);
  //   return DataResponse.ok();
  // }

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoadUser)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async search(
    @Query() payload: UserBookingSearchPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<Partial<BookingStreamDto>>>> {
    const query = user ? {
      ...payload,
      userId: user._id
    } : payload;
    const result = await this.userBookingStreamService.search(query);
    return DataResponse.ok(result);
  }
}
