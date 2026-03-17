import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule } from 'src/kernel';
import { authProviders } from './providers/auth.provider';
import { UserModule } from '../user/user.module';
import { AuthService } from './services';
import { OndatoService } from './services/ondato.service';
import { MailerModule } from '../mailer/mailer.module';
import {
  AuthGuard, RoleGuard, LoadUser, AccountGuard
} from './guards';
import { RegisterController } from './controllers/register.controller';
import { LoginController } from './controllers/login.controller';
import { PasswordController } from './controllers/password.controller';

// performer
// import { JumioController } from './controllers/jumio.controller';
import { OndatoController } from './controllers/ondato.controller';

import { PerformerRegisterController } from './controllers/performer-register.controller';
import { FileModule } from '../file/file.module';
import { PerformerModule } from '../performer/performer.module';
import { SettingModule } from '../settings/setting.module';
import { PaymentModule } from '../payment/payment.module';
import { ReferralModule } from '../referral/referral.module';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
  MongoDBModule,
  forwardRef(() => PerformerModule),
  forwardRef(() => UserModule),
  forwardRef(() => MailerModule),
  forwardRef(() => FileModule),
  forwardRef(() => SettingModule),
  forwardRef(() => PaymentModule),
  forwardRef(() => SocketModule),
  forwardRef(() => ReferralModule)
  ],
  providers: [
  ...authProviders,
  AuthService,
// JumioService,
  OndatoService,
  AuthGuard,
  RoleGuard,
  LoadUser,
  AccountGuard
  ],
  controllers: [
  RegisterController,
  LoginController,
  PasswordController,
  PerformerRegisterController,
// JumioController,
  OndatoController
  ],
  exports: [
  ...authProviders,
  AuthService,
// JumioService,
  OndatoService,
  AuthGuard,
  RoleGuard,
  LoadUser,
  AccountGuard
  ]
  })
export class AuthModule { }
