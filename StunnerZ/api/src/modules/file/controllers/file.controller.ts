import {
  HttpCode,
  HttpStatus,
  Controller,
  Get,
  Query,
  UseGuards,
  Res
} from '@nestjs/common';
import { FileService } from '../services';
import { Roles } from '../../auth';
import { RoleGuard } from '../../auth/guards';

@Controller('files')
export class FileController {
  constructor(
    private readonly fileService: FileService
  ) { }

  @Get('download')
  @HttpCode(HttpStatus.OK)
  public async downloadFile(
    @Res() response: any,
    @Query('key') key: string
  ): Promise<any> {
    const info = await this.fileService.getStreamToDownload(key);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename=${info.file.name}`
    );

    info.stream.pipe(response);
  }

  @Get('compress')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(RoleGuard)
  async doCompressPhotos(): Promise<any> {
    const parameters = {
      server: 's3',
      mimeType: /image/i,
      name: { $nin: [/.jpeg/i, /.jpg/i] },
      status: { $nin: ['error'] }
    };
    const files = await this.fileService.findAll(parameters);
    // eslint-disable-next-line no-restricted-syntax
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      await this.fileService.queueProcessCompressPhoto(file._id, file.getUrl(true));
    }

    return {
      total: files.length,
      files
    };
  }
}
