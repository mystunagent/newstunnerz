import { forwardRef, Module } from '@nestjs/common';
import { MongoDBModule, QueueModule } from 'src/kernel';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';
import { eventProvider } from './providers';
import { EventService } from './services';
import { AdminEventController, EventController } from './controllers';
import { FileModule } from '../file/file.module';
import { MailerModule } from '../mailer/mailer.module';
import { SettingModule } from '../settings/setting.module';
import { BookEventService } from './services/book-event.service';
import { TokenTransactionModule } from '../token-transaction/token-transaction.module';

@Module({
  imports:[
  MongoDBModule,
  QueueModule.forRoot(),
  forwardRef(() => AuthModule),
  forwardRef(() => PerformerModule),
  forwardRef(() => FileModule),
  forwardRef(() => MailerModule),
  forwardRef(() => SettingModule),
  forwardRef(() => TokenTransactionModule)
  ],
  providers: [
  ...eventProvider,
  EventService,
  BookEventService
  ],
  controllers: [
  EventController,
  AdminEventController
  ],
  exports: [
  EventService,
  BookEventService
  ]
  })
export class EventModule { }
