import {
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Controller,
  HttpException,
  Get,
  Query,
  forwardRef,
  Inject
} from '@nestjs/common';
import { UserService } from 'src/modules/user/services';
import { DataResponse } from 'src/kernel';
// import { SettingService } from 'src/modules/settings';
import {
  STATUS_INACTIVE
} from 'src/modules/user/constants';
import { PerformerService } from 'src/modules/performer/services';
import { PERFORMER_STATUSES } from 'src/modules/performer/constants';
// import { SETTING_KEYS } from 'src/modules/settings/constants';
import { isEmail } from 'src/kernel/helpers/string.helper';
import { AuthGooglePayload, LoginByUsernamePayload } from '../payloads';
import { AuthService, OndatoService } from '../services';
import {
  PasswordIncorrectException,
  EmailNotVerifiedException,
  AccountInactiveException
} from '../exceptions';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { pick } from 'lodash';

@Controller('auth')
export class LoginController {
  constructor(
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => OndatoService))
    private readonly ondatoService: OndatoService,
    @Inject(forwardRef(() => SocketUserService))
    private readonly socketUserService: SocketUserService,
    private readonly authService: AuthService
  ) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(
    @Body() req: LoginByUsernamePayload
  ): Promise<DataResponse<{ token: string, link: string }>> {
    const query = isEmail(req.username) ? { email: req.username.toLowerCase() } : { username: req.username };
    const [user, performer] = await Promise.all([
      this.userService.findOne(query),
      this.performerService.findOne(query)
    ]);
    if (!user && !performer) {
      throw new HttpException('This account is not found, please sign up', 404);
    }
    if ((user && user.status === STATUS_INACTIVE) || (performer && performer.status === PERFORMER_STATUSES.INACTIVE)) {
      throw new AccountInactiveException();
    }

    if (performer && !performer.verifiedDocument) {
      const ondatoBody = {
        registration: pick(performer, ['email']),
        externalReferenceId: performer?._id?.toString()
      };
      const response = await this.ondatoService.generateIDVUrl(ondatoBody) as any;
      return DataResponse.ok({ token: null , link: response?.url });
    }

    const [authUser, authPerformer, authSubPerformer] = await Promise.all([
      user && this.authService.findBySource({
        source: 'user',
        sourceId: user._id
      }),
      performer && this.authService.findBySource({
        source: 'performer',
        sourceId: performer._id
      }),
      user && this.authService.findBySource({
        source: 'sub_performer',
        sourceId: user._id
      })
    ]);

    if (!authUser && !authPerformer && !authSubPerformer) {
      throw new HttpException('This account is not found, please sign up', 404);
    }
    if (authUser && !this.authService.verifyPassword(req.password, authUser)) {
      throw new PasswordIncorrectException();
    }
    if (authSubPerformer && !this.authService.verifyPassword(req.password, authSubPerformer)) {
      throw new PasswordIncorrectException();
    }
    if (authPerformer && !this.authService.verifyPassword(req.password, authPerformer)) {
      throw new PasswordIncorrectException();
    }
    // dont check verified email anymore
    // const requireEmailVerification = SettingService.getValueByKey(
    //   SETTING_KEYS.REQUIRE_EMAIL_VERIFICATION
    // );
    // if ((requireEmailVerification && user && !user.verifiedEmail) || (requireEmailVerification && performer && !performer.verifiedEmail)) {
    //   throw new EmailNotVerifiedException();
    // }
    // required verified email for user only
    if ((user && user.roles[0] !== 'admin' && !user.verifiedEmail)) {
      throw new EmailNotVerifiedException();
    }
    let token = null;
    // auth token expired in 7d
    if (authUser) {
      token = this.authService.generateJWT(authUser, { expiresIn: 60 * 60 * 24 * 7 });
    }
    if (!authUser && authPerformer) {
      token = this.authService.generateJWT(authPerformer, { expiresIn: 60 * 60 * 24 * 7 });
    }
    if (!authUser && !authPerformer && authSubPerformer) {
      token = this.authService.generateJWT(authSubPerformer, { expiresIn: 60 * 60 * 24 * 7 });
    }
    const userOnline = await this.userService.find({ isOnline: 1 });
    const performerOnline = await this.performerService.find({ isOnline: 1 });
    if(userOnline) {
      const userIds = userOnline.filter((i) => i._id !== user?._id).map((u) => u._id);
      await this.socketUserService.emitToUsers(userIds, 'user_login', token);
    }
    if(performerOnline) {
      const performerIds = performerOnline.filter((i) => i._id !== performer?._id).map((u) => u._id);
      await this.socketUserService.emitToUsers(performerIds, 'performer_login', token);
    }
    return DataResponse.ok({ token, link: '/' });
  }

  @Get('twitter/login')
  @HttpCode(HttpStatus.OK)
  public async twitterLogin(
  // @Request() req: any
  ): Promise<DataResponse<any>> {
    const resp = await this.authService.loginTwitter();
    return DataResponse.ok(resp);
  }

  @Post('google/login')
  @HttpCode(HttpStatus.OK)
  public async googleLogin(
    @Body() payload: AuthGooglePayload
  ): Promise<DataResponse<any>> {
    const resp = await this.authService.verifyLoginGoogle(payload);
    return DataResponse.ok(resp);
  }

  @Get('twitter/callback')
  @HttpCode(HttpStatus.OK)
  public async twitterCallback(
    @Query() req: any
  ): Promise<DataResponse<any>> {
    const resp = await this.authService.twitterLoginCallback(req);
    return DataResponse.ok(resp);
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  public async logout(
    @Body('id') id: any
  ) {
    await this.authService.logout(id);
    return DataResponse.ok(true);
  }
}
