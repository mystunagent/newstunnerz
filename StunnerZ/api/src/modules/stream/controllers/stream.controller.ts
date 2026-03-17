import {
  Controller,
  Injectable,
  UseGuards,
  Body,
  Post,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Get,
  Param,
  Put,
  Query,
  UseInterceptors,
  Delete
} from '@nestjs/common';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import { DataResponse, PageableData } from 'src/kernel';
import { CurrentUser, Privileges, Roles } from 'src/modules/auth';
import { PerformerDto } from 'src/modules/performer/dtos';
import { UserDto } from 'src/modules/user/dtos';
import { UserInterceptor } from 'src/modules/auth/interceptors';
import { PERFORMER_PRIVILEGES } from 'src/modules/user/constants';
import { StreamService } from '../services/stream.service';
import {
  StartStreamPayload, SetDurationPayload, SearchStreamPayload, UpdateStreamPayload
} from '../payloads';
import { StreamDto } from '../dtos';

@Injectable()
@Controller('streaming')
export class StreamController {
  constructor(private readonly streamService: StreamService) { }

  @Get('/admin/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getList(
    @Query() req: SearchStreamPayload
  ): Promise<DataResponse<PageableData<StreamDto>>> {
    const data = await this.streamService.adminSearch(req);
    return DataResponse.ok(data);
  }

  @Get('/user/search')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(UserInterceptor)
  @UsePipes(new ValidationPipe({ transform: true }))
  async userList(
    @Query() req: SearchStreamPayload,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<PageableData<StreamDto>>> {
    const data = await this.streamService.userSearch(req, user);
    return DataResponse.ok(data);
  }

  @Post('/admin/end-session/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true }))
  async endSession(
    @Param('id') id: string
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.endSessionStream(id);
    return DataResponse.ok(data);
  }

  @Post('/live')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @Privileges(PERFORMER_PRIVILEGES.ALL)
  @UsePipes(new ValidationPipe({ transform: true }))
  async goLive(
    @CurrentUser() performer: PerformerDto,
    @Body() payload: StartStreamPayload
  ) {
    const data = await this.streamService.goLive(payload, performer);
    return DataResponse.ok(data);
  }

  @Put('/live/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UsePipes(new ValidationPipe({ transform: true }))
  @Privileges(PERFORMER_PRIVILEGES.ALL)
  async editLive(
    @Param('id') id: string,
    @Body() payload: UpdateStreamPayload
  ) {
    const data = await this.streamService.editLive(id, payload);
    return DataResponse.ok(data);
  }

  @Put('/update-live/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UsePipes(new ValidationPipe({ transform: true }))
  @Privileges(PERFORMER_PRIVILEGES.ALL)
  async autoUpdateLive(
    @Param('id') id: string,
    @Body('total') total: string
  ) {
    const data = await this.streamService.autoUpdateTotalMember(id, total);
    return DataResponse.ok(data);
  }

  @Get('/live/search/:streamId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async searchLive(
    @Param('streamId') streamId: string
  ) {
    const data = await this.streamService.searchLive(streamId);
    return DataResponse.ok(data);
  }

  @Post('/join/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async join(
    @Param('id') performerId: string,
    @CurrentUser() user: UserDto
  ) {
    const data = await this.streamService.joinPublicChat(performerId, user);
    return DataResponse.ok(data);
  }

  @Put('/set-duration')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  async setDuration(
    @CurrentUser() user: PerformerDto,
    @Body() payload: SetDurationPayload
  ): Promise<DataResponse<any>> {
    const result = await this.streamService.updateStreamDuration(payload, user);
    return DataResponse.ok(result);
  }

  @Post('/private-chat/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('user')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async requestPrivateChat(
    @Param('id') performerId: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.requestPrivateChat(user, performerId);

    return DataResponse.ok(data);
  }

  @Get('/private-chat/accept-request/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UsePipes(new ValidationPipe({ transform: true }))
  async acceptPrivateChat(
    @Param('id') id: string,
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.acceptPrivateChat(id, performer._id, performer.username);
    return DataResponse.ok(data);
  }

  @Get('/private-chat/join-booking/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async joinBookingPrivateChat(
    @Param('id') id: string
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.getBookPrivateChat(id);
    return DataResponse.ok(data);
  }

  @Post('/private-chat/finish-booking/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UsePipes(new ValidationPipe({ transform: true }))
  async finishBookingPrivateChat(
    @Param('id') id: string
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.finishBookPrivateChat(id);
    return DataResponse.ok(data);
  }

  @Get('/private-chat/check-stream/:id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPrivateChat(
    @Param('id') id: string
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.getPrivateChat(id);
    return DataResponse.ok(data);
  }

  @Get('/private/available-list')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  async getAvailablePrivateStreams(
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<any>> {
    const result = await this.streamService.getAvailablePrivateStreamRequestsForPerformer(performer._id);
    return DataResponse.ok(result);
  }

  @Post('/private/remove-request')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  async removeAllRequest(
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<any>> {
    const result = await this.streamService.stopAllPrivateWait(performer._id);
    return DataResponse.ok(result);
  }

  @Post('/private/send-notify-join-room')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  async sendNotifyJoinRoom(
    @Body('id') id: string
  ): Promise<DataResponse<any>> {
    const result = await this.streamService.sendNotifyModelJoinPrivateRoom(id);
    return DataResponse.ok(result);
  }

  @Post('/private/user-join-booking-room')
  @HttpCode(HttpStatus.OK)
  @Roles('user')
  @UseGuards(RoleGuard)
  async userJoinBookingRoom(
    @Body('id') id: string
  ): Promise<DataResponse<any>> {
    const result = await this.streamService.userJoinBookingRoom(id);
    return DataResponse.ok(result);
  }

  @Post('/private/send-notify-left-room')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  async sendNotifyLeftRoom(
    @Body('id') id: string
  ): Promise<DataResponse<any>> {
    const result = await this.streamService.sendNotifyModelLeftPrivateRoom(id);
    return DataResponse.ok(result);
  }

  @Post('/private/send-notify-user-left-room')
  @HttpCode(HttpStatus.OK)
  @Roles('user')
  @UseGuards(RoleGuard)
  async sendNotifyUserLeftRoom(
    @Body('id') id: string
  ): Promise<DataResponse<any>> {
    const result = await this.streamService.sendNotifyUserLeftPrivateRoom(id);
    return DataResponse.ok(result);
  }

  @Post('/private/user-remove-request')
  @HttpCode(HttpStatus.OK)
  @Roles('user')
  @UseGuards(RoleGuard)
  async userRemoveRequest(
    @CurrentUser() user: UserDto,
    @Body('performerId') performerId: string
  ): Promise<DataResponse<any>> {
    const result = await this.streamService.userRemoveRequest(user, performerId);
    return DataResponse.ok(result);
  }

  @Post('/private/notify-model-accept')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  async sendNotify(
    @Body('conversationId') conversationId: string
  ): Promise<DataResponse<any>> {
    const result = await this.streamService.sendNotifyRedirectPrivateChat(conversationId);
    return DataResponse.ok(result);
  }

  @Delete('/private-chat/reject-request/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @UsePipes(new ValidationPipe({ transform: true }))
  async rejectPrivateChat(
    @Param('id') id: string,
    @CurrentUser() performer: PerformerDto
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.removeRequestPrivateStream(id);
    return DataResponse.ok(data);
  }

  @Get('/booking-chat/get-member/:sessionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async checkMemberBooking(
    @Param('sessionId') sessionId: string,
  ): Promise<DataResponse<any>> {
    const data = await this.streamService.checkMemberBookingRoom(sessionId);
    return DataResponse.ok(data);
  }
}
