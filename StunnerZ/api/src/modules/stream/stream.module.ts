import { Module, forwardRef, HttpModule } from '@nestjs/common';
import * as https from 'https';
import { MongoDBModule, QueueModule } from 'src/kernel';
import { SubscriptionModule } from 'src/modules/subscription/subscription.module';
import { assetsProviders } from './providers/stream.provider';
import { PerformerModule } from '../performer/performer.module';
import { AuthModule } from '../auth/auth.module';
import { StreamService, AgoraService, StreamRequestSerivce } from './services';
import {
  AgoraController,
  StreamController,
  StreamRequestController
} from './controllers';
import { MessageModule } from '../message/message.module';
import { SocketModule } from '../socket/socket.module';
import { PrivateStreamWsGateway, PublicStreamWsGateway } from './gateways';
import { StreamConnectListener } from './listeners';
import { SettingModule } from '../settings/setting.module';
import { PaymentModule } from '../payment/payment.module';
import { UserModule } from '../user/user.module';
import { TokenTransactionModule } from '../token-transaction/token-transaction.module';
import { MailerModule } from '../mailer/mailer.module';
import { BookingStreamModule } from '../booking-stream/booking-stream.module';
import { BookingStreamListener } from './listeners/booking-stream.listener';

const agent = new https.Agent({
  rejectUnauthorized: process.env.REJECT_UNAUTHORIZED !== 'false'
});

@Module({
  imports: [
  MongoDBModule,
  HttpModule.register({
    timeout: 10000,
    maxRedirects: 5,
    httpsAgent: agent,
    }),
    QueueModule.forRoot(),
    forwardRef(() => UserModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => MessageModule),
    forwardRef(() => SocketModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => MessageModule),
    forwardRef(() => SettingModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => MailerModule),
    forwardRef(() => TokenTransactionModule),
    forwardRef(() => BookingStreamModule)
  ],
  providers: [
    ...assetsProviders,
    StreamService,
    AgoraService,
    StreamConnectListener,
    BookingStreamListener,
    PublicStreamWsGateway,
    StreamRequestSerivce,
    PrivateStreamWsGateway
  ],
  controllers: [StreamController, AgoraController, StreamRequestController],
  exports: [StreamService],
  })
export class StreamModule {}
