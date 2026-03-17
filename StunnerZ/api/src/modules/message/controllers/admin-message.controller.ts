import {
  Controller,
  Injectable,
  HttpCode,
  HttpStatus,
  UseGuards,
  Post,
  UsePipes,
  ValidationPipe,
  Body
} from '@nestjs/common';
import { DataResponse, getConfig } from 'src/kernel';
import { RoleGuard } from 'src/modules/auth/guards';
import { Roles } from 'src/modules/auth';
import { Delete, Param, UseInterceptors } from '@nestjs/common/decorators';
import { FileDto, FileUploaded, FileUploadInterceptor } from 'src/modules/file';
import { S3ObjectCannelACL, Storage } from 'src/modules/storage/contants';
import { MassMessagePayload } from '../payloads/mass-message.payload';
import { MessageService } from '../services';

@Injectable()
@Controller('admin/messages/mass-message')
export class AdminMessageController {
  constructor(
    private readonly messageService: MessageService
  ) { }

  @Post('/')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true
  }))
  async adminMassMessages(
    @Body() payload: MassMessagePayload
  ): Promise<DataResponse<any>> {
    const data = await this.messageService.create(payload);
    return DataResponse.ok(data);
  }

  @Post('/file/upload')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('admin')
  @UseInterceptors(
    FileUploadInterceptor('mass-message', 'mass-message', {
      destination: getConfig('file').massMessageDir,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
    })
  )
  async uploadMassMessage(
    @FileUploaded() file: FileDto
  ): Promise<any> {
    return DataResponse.ok({
      success: true,
      ...file.toResponse(),
      url: file.getUrl()
    });
  }

  @Delete('/:fileId')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async deleteMassMessageFile(
    @Param('fileId') fileId: string
  ): Promise<DataResponse<any>> {
    const data = await this.messageService.deleteMassMessageFile(fileId);
    return DataResponse.ok(data);
  }
}
