import { SearchInfoPerformerInsertedPayload } from './../payloads/performer-search.payload';
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
  Put,
  Get,
  Param,
  Query,
  Request,
  UseInterceptors,
  HttpException,
  Inject,
  forwardRef
} from '@nestjs/common';
import {
  DataResponse,
  PageableData,
  getConfig,
  ForbiddenException
} from 'src/kernel';
import { AuthService } from 'src/modules/auth/services';
import { AccountGuard, LoadUser, RoleGuard } from 'src/modules/auth/guards';
import { CurrentUser, Privileges, Roles } from 'src/modules/auth/decorators';
import {
  FileUploadInterceptor, FileUploaded, FileDto
} from 'src/modules/file';
import { CountryService } from 'src/modules/utils/services';
import { UserDto } from 'src/modules/user/dtos';
import { S3ObjectCannelACL, Storage } from 'src/modules/storage/contants';
import { PERFORMER_PRIVILEGES } from 'src/modules/user/constants';
import { PERFORMER_STATUSES } from '../constants';
import {
  PerformerDto,
  IPerformerResponse
} from '../dtos';
import {
  SelfUpdatePayload,
  PerformerSearchPayload,
  BankingSettingPayload,
  PaymentGatewaySettingPayload
} from '../payloads';
import { PerformerService, PerformerSearchService } from '../services';

@Injectable()
@Controller('performers')
export class PerformerController {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => CountryService))
    private readonly countryService: CountryService,
    private readonly performerService: PerformerService,
    private readonly performerSearchService: PerformerSearchService

  ) {}

  @Get('/me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @Privileges(PERFORMER_PRIVILEGES.ALL)
  async me(
    @Request() req: any
  ): Promise<DataResponse<IPerformerResponse>> {
    const user = await this.performerService.getDetails(req.user._id, req.jwToken);
    return DataResponse.ok(new PerformerDto(user).toResponse(true, false));
  }

  @Get('/user/search')
  @UseGuards(LoadUser)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async usearch(
    @Query() query: PerformerSearchPayload,
    @CurrentUser() currentUser: UserDto
  ): Promise<DataResponse<PageableData<IPerformerResponse>>> {
    const data = await this.performerSearchService.search(query, currentUser);
    return DataResponse.ok(data);
  }

  @Get('/user/search-no-auth')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async uSearchNoAuth(
    @Query() query: PerformerSearchPayload
  ): Promise<DataResponse<PageableData<IPerformerResponse>>> {
    const data = await this.performerSearchService.search(query, null);
    return DataResponse.ok(data);
  }

  @Get('/search/random')
  @UseGuards(LoadUser)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async randomSearch(
    @Query() req: PerformerSearchPayload,
    @CurrentUser() currentUser: UserDto
  ): Promise<DataResponse<any>> {
    const data = await this.performerSearchService.randomSearch(req, currentUser);
    return DataResponse.ok(data);
  }

  @Put('/:id')
  @UseGuards(RoleGuard)
  @Roles('performer')
  @HttpCode(HttpStatus.OK)
  @Privileges(PERFORMER_PRIVILEGES.EDIT_PROFILE)
  async updateUser(
    @Body() payload: SelfUpdatePayload,
    @Param('id') performerId: string,
    @Request() req: any
  ): Promise<DataResponse<IPerformerResponse>> {
    await this.performerService.selfUpdate(performerId, payload);
    const performer = await this.performerService.getDetails(performerId, req.jwToken);

    if (payload.password) {
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
    }
    return DataResponse.ok(new PerformerDto(performer).toResponse(true, false));
  }

  @Get('/:username')
  @UseGuards(LoadUser)
  @HttpCode(HttpStatus.OK)
  async getDetails(
    @Param('username') performerUsername: string,
    @CurrentUser() user: UserDto
  ): Promise<DataResponse<Partial<PerformerDto>>> {
    const performer = await this.performerService.findByUsername(performerUsername, user);
    if (!performer || performer.status !== PERFORMER_STATUSES.ACTIVE) {
      throw new HttpException('This account is suspended', 403);
    }

    return DataResponse.ok(performer.toPublicDetailsResponse());
  }

  @Get('/:username/check-block-country')
  @UseGuards(LoadUser)
  @HttpCode(HttpStatus.OK)
  async checkBlockCountry(
    @Param('username') performerUsername: string,
    @Request() req: any,
    @CurrentUser() user: UserDto
  ): Promise<any> {
    let ipClient = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (ipClient.substr(0, 7) === '::ffff:') {
      ipClient = ipClient.substr(7);
    }

    const whiteListIps = ['127.0.0.1', '0.0.0.1'];
    let userCountry = null;
    let countryCode = null;
    if (whiteListIps.indexOf(ipClient) === -1) {
      userCountry = await this.countryService.findCountryByIP(ipClient);
      if (userCountry && userCountry.status === 'success' && userCountry.countryCode) {
        countryCode = userCountry.countryCode;
      }
    }
    const isBlockedCountry = await this.performerService.checkBlockCountry(
      performerUsername,
      countryCode,
      user
    );
    return DataResponse.ok(isBlockedCountry);
  }

  @Get('/:username/check-block-by-performer')
  @UseGuards(LoadUser)
  @HttpCode(HttpStatus.OK)
  async checkBlockByPerformer(
    @Param('username') performerUsername: string,
    @Request() req: any,
    @CurrentUser() user: UserDto
  ): Promise<any> {
    const isBlockedByPerfomer = await this.performerService.checkBlockedByPerformer(
      performerUsername,
      user
    );
    return DataResponse.ok(isBlockedByPerfomer);
  }

  @Post('/avatar/upload')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @Privileges(PERFORMER_PRIVILEGES.ALL)
  @UseInterceptors(
    FileUploadInterceptor('avatar', 'avatar', {
      destination: getConfig('file').avatarDir,
      uploadImmediately: true,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
      })
  )
  async uploadPerformerAvatar(
    @FileUploaded() file: FileDto,
    @CurrentUser() performer: UserDto
  ): Promise<any> {
    await this.performerService.updateAvatar(performer._id, file);
    return DataResponse.ok({
      ...file,
      url: file.getUrl()
    });
  }

  @Post('/welcome-message/upload')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @Privileges(PERFORMER_PRIVILEGES.ALL)
  @UseInterceptors(
    FileUploadInterceptor('welcome-message', 'welcome-message', {
      destination: getConfig('file').welcomeMessageDir,
      uploadImmediately: true,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
      })
  )
  async uploadWelcomeMessage(
    @FileUploaded() file: FileDto,
    @CurrentUser() performer: UserDto
  ): Promise<any> {
    await this.performerService.updateWelcomeMessage(performer._id, file);
    return DataResponse.ok({
      ...file,
      url: file.getUrl()
    });
  }

  @Post('/cover/upload')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @Privileges(PERFORMER_PRIVILEGES.ALL)
  @UseInterceptors(
    FileUploadInterceptor('cover', 'cover', {
      destination: getConfig('file').coverDir,
      uploadImmediately: true,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
      })
  )
  async uploadPerformerCover(
    @FileUploaded() file: FileDto,
    @CurrentUser() performer: UserDto
  ): Promise<any> {
    // TODO - define url for perfomer id if have?
    await this.performerService.updateCover(performer._id, file);
    return DataResponse.ok({
      ...file,
      url: file.getUrl()
    });
  }

  @Post('/welcome-video/upload')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @Privileges(PERFORMER_PRIVILEGES.ALL)
  @UseInterceptors(
    FileUploadInterceptor('performer-welcome-video', 'welcome-video', {
      destination: getConfig('file').videoDir,
      acl: S3ObjectCannelACL.PublicRead,
      server: Storage.S3
      })
  )
  async uploadPerformerVideo(
    @FileUploaded() file: FileDto,
    @CurrentUser() performer: PerformerDto
  ): Promise<any> {
    // TODO - define url for perfomer id if have?
    await this.performerService.updateWelcomeVideo(performer._id, file);
    return DataResponse.ok({
      ...file,
      url: file.getUrl(true)
    });
  }

  @Get('/search/banking-settings/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @Privileges(PERFORMER_PRIVILEGES.ALL)
  async getBankingSetting(
    @Param('id') id: string
  ) {
    const data = await this.performerService.getBankInfo(id);
    return DataResponse.ok(data);
  }

  @Get('/search/banking-settings-sub-performer/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @Privileges(PERFORMER_PRIVILEGES.SUB_ACCOUNT)
  async getBankingSettingOfSubPerformer(
    @Param('id') id: string
  ) {
    const data = await this.performerService.getBankInfo(id);
    return DataResponse.ok(data);
  }

  @Put('/:id/banking-settings')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  @Privileges(PERFORMER_PRIVILEGES.ALL)
  async updateBankingSetting(
    @Param('id') performerId: string,
    @Body() payload: BankingSettingPayload,
    @CurrentUser() user: UserDto
  ) {
    const data = await this.performerService.updateBankingSetting(
      performerId,
      payload,
      user
    );
    return DataResponse.ok(data);
  }

  @Put('/update-price/booking-stream')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  @Roles('performer')
  async updatePriceBookStream(
    @Body('price') price: number,
    @CurrentUser() user: UserDto
  ) {
    const data = await this.performerService.updatePriceForBooking(
      user._id,
      price
    );
    return DataResponse.ok(data);
  }

  @Put('/:id/payment-gateway-settings')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  @Privileges(PERFORMER_PRIVILEGES.ALL)
  async updatePaymentGatewaySetting(
    @Body() payload: PaymentGatewaySettingPayload,
    @CurrentUser() user: UserDto
  ) {
    // eslint-disable-next-line no-param-reassign
    payload.performerId = user._id;
    const data = await this.performerService.updatePaymentGateway(payload);
    return DataResponse.ok(data);
  }

  @Get('/documents/auth/check')
  @HttpCode(HttpStatus.OK)
  async checkAuth(
    @Request() req: any
  ) {
    if (!req.query.token) throw new ForbiddenException();
    const user = await this.authService.getSourceFromJWT(req.query.token);
    if (!user) {
      throw new ForbiddenException();
    }
    const valid = await this.performerService.checkAuthDocument(req, user);
    return DataResponse.ok(valid);
  }

  @Get('/user/search/username')
  @HttpCode(HttpStatus.OK)
  async getUsername(
    @Request() req: any
  ) {
    const result = await this.performerSearchService.getNamesPerformer(req);
    return DataResponse.ok(result);
  }

  @Get('/privileges/list')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(AccountGuard)
  async getPrivileges(
    @Request() req: any
  ) {
    if (!req.authUser.sourceId) throw new ForbiddenException();
    const data = await this.performerService.getPrivileges(req.authUser.sourceId);
    return DataResponse.ok(data);
  }

  @Post('/account-manager/update')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  async updateAccountManager(
    @Body('by') by: string,
    @CurrentUser() performer: PerformerDto
  ) {
    const data = await this.performerService.updateManagerAccount(performer, by);
    return DataResponse.ok(data);
  }

  @Post('/account-manager/update-banking/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  async updateBankingSubPerformer(
    @Param('id') performerId: string,
    @Body() payload: BankingSettingPayload
  ) {
    const data = await this.performerService.updateBankingForSubPerformer(
      performerId,
      payload
    );
    return DataResponse.ok(data);
  }

  @Get('/account-manager/name')
  @HttpCode(HttpStatus.OK)
  @Roles('performer')
  @UseGuards(RoleGuard)
  async getNameAccountManager(
    @CurrentUser() performer: PerformerDto
  ) {
    const data = await this.performerService.getNameSubAccount(performer);
    return DataResponse.ok(data);
  }

  @Get('/info-inserted/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoadUser)
  async getInfoPerformerInserted(
    @Query() req: PerformerSearchPayload
  ) {
    const data = await this.performerSearchService.getInfoPerformerInserted(req);
    return DataResponse.ok(data);
  }
}
