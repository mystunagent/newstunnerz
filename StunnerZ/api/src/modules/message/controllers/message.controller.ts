import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  ForbiddenException,
  Get,
  Query,
  Param,
  Delete,
  UseInterceptors
} from '@nestjs/common';
import { DataResponse, getConfig } from 'src/kernel';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import {
  MultiFileUploadInterceptor, FilesUploaded, FileUploadInterceptor, FileUploaded, FileDto
} from 'src/modules/file';
import { S3ObjectCannelACL, Storage } from 'src/modules/storage/contants';
import { CurrentUser, Roles } from 'src/modules/auth';
import { UserDto } from 'src/modules/user/dtos';
import { MessageService, NotificationMessageService } from '../services';
import {
  MessageListRequest, MessageCreatePayload, PrivateMessageCreatePayload
} from '../payloads';
import { MessageDto } from '../dtos';
import { MassMessagePayload } from '../payloads/mass-message.payload';

@Injectable()
@Controller('messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly notificationMessageService: NotificationMessageService
  ) { }

  @Post('/private/file')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UseInterceptors(
    // TODO - check and support multiple files!!!
    MultiFileUploadInterceptor([
      {
      type: 'message-photo',
      fieldName: 'message-photo',
      options: {
      destination: getConfig('file').imageDir,
      uploadImmediately: true,
      generateThumbnail: true,
      thumbnailSize: {
      width: 250,
      height: 250
      },
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
      }
      }
      ])
  )
  async createPrivateFileMessage(
    @FilesUploaded() files: Record<string, any>,
    @Body() payload: PrivateMessageCreatePayload,
    @Request() req: any
  ): Promise<DataResponse<MessageDto>> {
    let message;
    if (req.authUser.source === 'sub_performer') {
      if (req.authUser.sourceId.toString() === payload.recipientId.toString()) {
        throw new ForbiddenException();
      }
      message = await this.messageService.createPrivateFileMessage(
        {
          source: 'performer',
          sourceId: req.user._id
        },
        {
          source: payload.recipientType,
          sourceId: payload.recipientId
        },
        files['message-photo'],
        payload
      );
    } else {
      if (req.authUser.sourceId.toString() === payload.recipientId.toString()) {
        throw new ForbiddenException();
      }
      message = await this.messageService.createPrivateFileMessage(
        {
          source: req.authUser.source,
          sourceId: req.authUser.sourceId
        },
        {
          source: payload.recipientType,
          sourceId: payload.recipientId
        },
        files['message-photo'],
        payload
      );
    }
    return DataResponse.ok(message);
  }

  @Post('/read-all/:conversationId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async readAllMessage(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<MessageDto>> {
    const message = await this.notificationMessageService.recipientReadAllMessageInConversation(user, conversationId);
    return DataResponse.ok(message);
  }

  @Get('/counting-not-read-messages')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async countTotalNotReadMessage(
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.notificationMessageService.countTotalNotReadMessage(user._id);
    return DataResponse.ok(data);
  }

  @Get('/conversations/message/:messageId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async loadMessageDetail(
    @Param('messageId') messageId: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<MessageDto>> {
    const data = await this.messageService.loadMessageDetail(messageId, user);
    return DataResponse.ok(data);
  }

  @Get('/conversations/:conversationId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async loadMessages(
    @Query() req: MessageListRequest,
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    // eslint-disable-next-line no-param-reassign
    req.conversationId = conversationId;
    // todo - public files if it's media message
    const data = await this.messageService.loadMessages(req, user);
    return DataResponse.ok(data);
  }

  @Post('/conversations/:conversationId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createMessage(
    @Body() payload: MessageCreatePayload,
    @Param('conversationId') conversationId: string,
    @Request() req: any
  ): Promise<DataResponse<any>> {
    // todo - can upload file here, check upload file above
    let data;
    if (req.authUser.source === 'sub_performer') {
      data = await this.messageService.createPrivateMessage(
        conversationId,
        payload,
        {
          source: 'performer',
          sourceId: req.user._id
        }
      );
    } else {
      data = await this.messageService.createPrivateMessage(
        conversationId,
        payload,
        {
          source: req.authUser.source,
          sourceId: req.authUser.sourceId
        }
      );
    }
    return DataResponse.ok(data);
  }

  @Post('/paid-content/conversations/:conversationId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(
    FileUploadInterceptor('message-file', 'message-file', {
      destination: getConfig('file').paidContentDir,
      acl: S3ObjectCannelACL.AuthenticatedRead,
      uploadImmediately: true,
      generateThumbnail: true,
      thumbnailSize: {
      width: 50,
      height: 50
      },
      server: Storage.S3
      })
  )
  async createPaidMessage(
    @FileUploaded() file: FileDto,
    @Body() payload: MessageCreatePayload,
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.messageService.createPrivatePaidContent(
      file,
      conversationId,
      payload,
      {
        source: 'performer',
        sourceId: user._id
      }
    );
    return DataResponse.ok(data);
  }

  @Post('/free-content/conversations/:conversationId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(
    FileUploadInterceptor('message-file', 'message-file', {
      destination: getConfig('file').paidContentDir,
      acl: S3ObjectCannelACL.PublicRead,
      uploadImmediately: true,
      generateThumbnail: true,
      thumbnailSize: {
      width: 250,
      height: 250
      },
      server: Storage.S3
      })
  )
  async createFreeMessage(
    @FileUploaded() file: FileDto,
    @Body() payload: MessageCreatePayload,
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.messageService.createPrivateFreeContent(
      file,
      conversationId,
      payload,
      {
        source: 'performer',
        sourceId: user._id
      }
    );
    return DataResponse.ok(data);
  }

  @Post('/stream/conversations/:conversationId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createStreamMessage(
    @Body() payload: MessageCreatePayload,
    @Param('conversationId') conversationId: string,
    @Request() req: any,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    let data;
    if (req.authUser.source === 'sub_performer') {
      data = await this.messageService.createStreamMessageFromConversation(
        conversationId,
        payload,
        {
          source: 'performer',
          sourceId: req.user._id
        },
        user
      );
    } else {
      data = await this.messageService.createStreamMessageFromConversation(
        conversationId,
        payload,
        {
          source: req.authUser.source,
          sourceId: req.authUser.sourceId
        },
        user
      );
    }
    return DataResponse.ok(data);
  }

  @Delete('/:messageId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.messageService.deleteMessage(
      messageId,
      user
    );
    return DataResponse.ok(data);
  }

  @Delete('/:conversationId/remove-all-message')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'performer')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async deleteAllPublicMessage(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any
  ): Promise<DataResponse<any>> {
    const data = await this.messageService.deleteAllMessageInConversation(
      conversationId,
      user
    );
    return DataResponse.ok(data);
  }

  @Get('/conversations/public/:conversationId')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async loadPublicMessages(
    @Query() req: MessageListRequest,
    @Param('conversationId') conversationId: string
  ): Promise<DataResponse<any>> {
    // eslint-disable-next-line no-param-reassign
    req.conversationId = conversationId;
    const data = await this.messageService.loadPublicMessages(req);
    return DataResponse.ok(data);
  }
}
