import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Post,
  Body,
  Query,
  Delete,
  Put,
  Param
} from '@nestjs/common';
import { DataResponse, PageableData } from 'src/kernel';
import { Roles, CurrentUser } from 'src/modules/auth';
import { LoadUser, RoleGuard } from 'src/modules/auth/guards';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserDto } from 'src/modules/user/dtos';
import { UpcomingStreamDto } from '../dtos';
import {
  CreateUpcomingStreamPayload,
  UpcomingStreamSearchPayload,
  UpdateUpcomingStreamPayload
} from '../payloads';
import { UpcomingStreamService } from '../services';

@Controller("/upcoming/stream")
export class UpcomingStreamController {
  constructor(private readonly upcomingStreamService: UpcomingStreamService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles("performer")
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async search(
    @Query() payload: UpcomingStreamSearchPayload,
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<PageableData<Partial<UpcomingStreamDto>>>> {
    const query = {
      ...payload,
      performerId: performer._id.toString()
    };

    const result = await this.upcomingStreamService.search(query);
    return DataResponse.ok(result);
  }

  @Get("/user-search")
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoadUser)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async userSearch(
    @Query() payload: UpcomingStreamSearchPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<Partial<UpcomingStreamDto>>>> {
    const result = await this.upcomingStreamService.search(payload, user);
    return DataResponse.ok(result);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @Roles("performer")
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async create(
    @Body() payload: CreateUpcomingStreamPayload,
    @CurrentUser() performer: PerformerDto
  ) {
    const result = await this.upcomingStreamService.create(payload, performer);
    return DataResponse.ok(result);
  }

  @Put("/:id")
  @HttpCode(HttpStatus.OK)
  @Roles("performer")
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async update(
    @Param("id") id: string,
    @Body() payload: UpdateUpcomingStreamPayload,
    @CurrentUser() performer: PerformerDto
  ) {
    const result = await this.upcomingStreamService.update(
      id,
      payload,
      performer
    );
    return DataResponse.ok(result);
  }

  @Put("/:id/status-stream")
  @HttpCode(HttpStatus.OK)
  @Roles("performer")
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async updateStatusStream(
    @Param("id") id: string
  ) {
    const result = await this.upcomingStreamService.updateStatus(
      id,
      'streamed'
    );
    return DataResponse.ok(result);
  }

  @Delete("/:id")
  @HttpCode(HttpStatus.OK)
  @Roles("performer")
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async delete(@Param("id") id: string) {
    const result = await this.upcomingStreamService.delete(id);
    return DataResponse.ok(result);
  }

  @Get('/:id/details')
  @HttpCode(HttpStatus.OK)
  @Roles("performer")
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async getDetails(
    @Param("id") id: string
  ) {
    const result = await this.upcomingStreamService.viewDetails(id.toString());
    return DataResponse.ok(result);
  }
}
