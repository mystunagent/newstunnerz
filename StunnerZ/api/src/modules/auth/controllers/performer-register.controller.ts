import {
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Controller,
  forwardRef,
  Inject,
  UseInterceptors,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { DataResponse, getConfig } from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { PERFORMER_STATUSES } from 'src/modules/performer/constants';
import { FileDto, FileUploaded, FileUploadInterceptor } from 'src/modules/file';
import { S3ObjectCannelACL, Storage } from 'src/modules/storage/contants';
import { pick } from 'lodash';
import { ReferralService } from 'src/modules/referral/referral.service';
import { PerformerRegister2Payload, PerformerRegisterPayload } from '../payloads';
import { AuthService, OndatoService } from '../services';

@Controller('auth/performers')
export class PerformerRegisterController {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    private readonly authService: AuthService,
    // private readonly jumioService: JumioService,
    private readonly ondatoService: OndatoService,
    private readonly referralService: ReferralService
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async performerRegister(
    @Body() payload: PerformerRegisterPayload
  ): Promise<DataResponse<any>> {
    const performer = await this.performerService.register({
      ...payload,
      avatarId: null,
      status: PERFORMER_STATUSES.ACTIVE
    });

    // create auth, email notification, etc...
    await Promise.all([
      performer.email && this.authService.create({
        source: 'performer',
        sourceId: performer._id,
        type: 'email',
        key: performer.email,
        value: payload.password
      }),
      performer.username && this.authService.create({
        source: 'performer',
        sourceId: performer._id,
        type: 'username',
        key: performer.username,
        value: payload.password
      })
    ]);

    // notify to verify email address
    performer.email && await this.authService.sendVerificationEmail(performer);

    // auth token expired in 7d
    const authPerformer = await this.authService.findBySource({
      source: 'performer',
      sourceId: performer._id
    });

    if (!authPerformer) {
      return DataResponse.ok({ message: 'Register successfully, please login' });
    }
    const token = this.authService.generateJWT(authPerformer, { expiresIn: 60 * 60 * 24 * 7 });
    return DataResponse.ok({ token });
  }

  @Post('register-new')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async performerRegisterNew(
    @Body() payload: PerformerRegister2Payload
  ): Promise<DataResponse<any>> {
    const performer = await this.performerService.register({
      ...payload,
      status: PERFORMER_STATUSES.ACTIVE
    });
    // create auth, email notification, etc...
    await Promise.all([
      performer.email && this.authService.create({
        source: 'performer',
        sourceId: performer._id,
        type: 'email',
        key: performer.email,
        value: payload.password
      }),
      performer.username && this.authService.create({
        source: 'performer',
        sourceId: performer._id,
        type: 'username',
        key: performer.username,
        value: payload.password
      })
    ]);
    // notify to verify email address
    performer.email && await this.authService.sendVerificationEmail(performer);

    // create sepa banking info
    if (performer?._id && payload?.bankingInfo) {
      await this.performerService.updateBankingSetting(
        performer?._id?.toString(),
        payload?.bankingInfo
      );
    }

    const ondatoBody = {
      registration: pick(performer, ['email']),
      externalReferenceId: performer?._id?.toString()
    };
    const response = await this.ondatoService.generateIDVUrl(ondatoBody);

    // Create referral by link
    if (payload.rel) {
      await this.referralService.newReferral({

        registerSource: 'performer',

        registerId: performer._id,

        code: payload.rel

      });
    }
    return DataResponse.ok(response);
  }

  @Post('/avatar/upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileUploadInterceptor('avatar', 'avatar', {
      destination: getConfig('file').avatarDir,
      uploadImmediately: true,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
    })
  )
  async uploadPerformerAvatar(
    @FileUploaded() file: FileDto
  ): Promise<any> {
    return DataResponse.ok({
      ...file,
      url: file.getUrl()
    });
  }

  @Post('/cover/upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileUploadInterceptor('cover', 'cover', {
      destination: getConfig('file').coverDir,
      uploadImmediately: true,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
    })
  )
  async uploadPerformerCover(
    @FileUploaded() file: FileDto
  ): Promise<any> {
    return DataResponse.ok({
      ...file,
      url: file.getUrl()
    });
  }

  @Post('/welcome-video/upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileUploadInterceptor('performer-welcome-video', 'welcome-video', {
      destination: getConfig('file').videoDir,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
    })
  )
  async uploadPerformerVideo(
    @FileUploaded() file: FileDto
  ): Promise<any> {
    return DataResponse.ok({
      ...file,
      url: file.getUrl(true)
    });
  }
}
