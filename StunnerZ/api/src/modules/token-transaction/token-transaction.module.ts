import { MongoDBModule, QueueModule } from 'src/kernel';
import { Module, forwardRef } from '@nestjs/common';
import { FeedModule } from 'src/modules/feed/feed.module';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { paymentTokenProviders } from './providers';
import { SettingModule } from '../settings/setting.module';
import { FileModule } from '../file/file.module';
import { MailerModule } from '../mailer/mailer.module';
import {
  TokenTransactionSearchService, TokenTransactionService
} from './services';
import {
  PaymentTokenController, PaymentTokenSearchController, PaymentTokenStreamController
} from './controllers';
import { TokenPackageModule } from '../token-package/token-package.module';
import { SocketModule } from '../socket/socket.module';
import { PaymentTokenListener } from './listeners';
import { SubscriptionModule } from '../subscription/subscription.module';
import { StreamModule } from '../stream/stream.module';
import { UserModule } from '../user/user.module';
import { MessageModule } from '../message/message.module';
import { TokenTransactionStreamService } from './services/token-transaction-stream.service';
import { EarningModule } from '../earning/earning.module';
import { earningProviders } from '../earning/providers/earning.provider';
import { BookingStreamModule } from '../booking-stream/booking-stream.module';

@Module({
  imports: [
    MongoDBModule,
    QueueModule.forRoot(),
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => SettingModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => FileModule),
    forwardRef(() => MailerModule),
    forwardRef(() => TokenPackageModule),
    forwardRef(() => SocketModule),
    forwardRef(() => FeedModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => StreamModule),
    forwardRef(() => MessageModule),
    forwardRef(() => BookingStreamModule),
    forwardRef(() => EarningModule)
  ],
  providers: [
    ...paymentTokenProviders,
    ...earningProviders,
    TokenTransactionService,
    TokenTransactionSearchService,
    TokenTransactionService,
    PaymentTokenListener,
    TokenTransactionStreamService
  ],
  controllers: [
    PaymentTokenController,
    PaymentTokenSearchController,
    PaymentTokenStreamController
  ],
  exports: [
    ...paymentTokenProviders,
    ...earningProviders,
    TokenTransactionService,
    TokenTransactionSearchService,
    TokenTransactionService,
    TokenTransactionStreamService
  ]
})
export class TokenTransactionModule { }
