import { Module, forwardRef } from '@nestjs/common';
import { AgendaModule, MongoDBModule, QueueModule } from 'src/kernel';
import { SocketModule } from '../socket/socket.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { PerformerModule } from '../performer/performer.module';
import { MailerModule } from '../mailer/mailer.module';
import { bookingStreamProviders } from './providers';
import { TokenTransactionModule } from '../token-transaction/token-transaction.module';
import {
  BookingStreamService, BookingStreamTaskService, PerformerBookingStreamService, SetUpTimeStreamService, UpcomingStreamService, UserBookingStreamService
} from './services';
import {
  PerformerBookingStreamController, SetTimeStreamController, UpcomingStreamController, UserBookingStreamController
} from './controllers';
import { MessageModule } from '../message/message.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
  MongoDBModule,
  AgendaModule.register(),
  QueueModule.forRoot(),
  forwardRef(() => UserModule),
  forwardRef(() => PerformerModule),
  forwardRef(() => AuthModule),
  forwardRef(() => MailerModule),
  forwardRef(() => TokenTransactionModule),
  forwardRef(() => MessageModule),
  forwardRef(() => SubscriptionModule),
  forwardRef(() => SocketModule)
  ],
  providers: [
  ...bookingStreamProviders,
  BookingStreamService,
  UserBookingStreamService,
  PerformerBookingStreamService,
  BookingStreamTaskService,
  SetUpTimeStreamService,
  UpcomingStreamService,
  ],
  controllers: [
  PerformerBookingStreamController,
  UserBookingStreamController,
  SetTimeStreamController,
  UpcomingStreamController
  ],
  exports: [BookingStreamService, SetUpTimeStreamService, UpcomingStreamService]
  })
export class BookingStreamModule { }
