import {
  Body,
  Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards, UsePipes, ValidationPipe
} from '@nestjs/common';
import { CurrentUser, Roles } from 'src/modules/auth';
import { RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { PerformerDto } from 'src/modules/performer/dtos';
import { CreateSetupTimeStreamPayload, SetUpTimeStreamSearchPayload, UpdateSetupTimeStreamPayload } from '../payloads';
import { SetUpTimeStreamService } from '../services';
import { SetUpTimeStreamDto } from '../dtos';

@Controller('/set-time/stream')
export class SetTimeStreamController {
  constructor(private readonly setTimeStream: SetUpTimeStreamService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async search(
  @Query() payload: SetUpTimeStreamSearchPayload,
  @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<PageableData<Partial<SetUpTimeStreamDto>>>> {
    const query = {
      ...payload,
      performerId: performer._id.toString()
    };

    const result = await this.setTimeStream.search(query);
    return DataResponse.ok(result);
  }

  @Get('/user-search')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async userSearch(
  @Query() payload: SetUpTimeStreamSearchPayload
  ): Promise<DataResponse<PageableData<Partial<SetUpTimeStreamDto>>>> {
    const result = await this.setTimeStream.search(payload);
    return DataResponse.ok(result);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async create(
  @Body() payload: CreateSetupTimeStreamPayload,
  @CurrentUser() performer: PerformerDto
  ) {
    const result = await this.setTimeStream.create(payload, performer);
    return DataResponse.ok(result);
  }

  @Put('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async update(
  @Param('id') id: string,
  @Body() payload: UpdateSetupTimeStreamPayload
  ) {
    const result = await this.setTimeStream.update(id, payload);
    return DataResponse.ok(result);
  }

  @Get('/:id/details')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async getDetails(
  @Param('id') id: string
  ) {
    const result = await this.setTimeStream.getDetail(id);
    return DataResponse.ok(result);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async delete(
  @Param('id') id: string
  ) {
    const result = await this.setTimeStream.delete(id);
    return DataResponse.ok(result);
  }
}
