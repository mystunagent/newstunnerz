import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, QueueModule } from 'src/kernel';
import { userProviders } from './providers';
import {
  UserController,
  AvatarController,
  AdminUserController,
  AdminAvatarController
} from './controllers';
import { UserService, UserSearchService } from './services';
import { AuthModule } from '../auth/auth.module';
import { FileModule } from '../file/file.module';
import { UserConnectedListener } from './listeners';
import { PerformerModule } from '../performer/performer.module';
import { ChangeTokenLogModule } from '../change-token-logs/change-token-log.module';
import { BlockModule } from '../block/block.module';
import { SubPerformerService } from './services/sub-performer.service';
import { SubPerformerController } from './controllers/sub-performer-controller';
import { AdminSubPerformerController } from './controllers/admin-sub-performer-controller';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
  MongoDBModule,
  QueueModule.forRoot(),
  forwardRef(() => AuthModule),
  forwardRef(() => PerformerModule),
  forwardRef(() => FileModule),
  forwardRef(() => ChangeTokenLogModule),
  forwardRef(() => BlockModule),
  forwardRef(() => MailerModule)
  ],
  providers: [
  ...userProviders,
  UserService,
  UserSearchService,
  UserConnectedListener,
  SubPerformerService,
  ],
  controllers: [
  UserController,
  AvatarController,
  AdminUserController,
  AdminAvatarController,
  SubPerformerController,
  AdminSubPerformerController
  ],
  exports: [...userProviders, UserService, UserSearchService, SubPerformerService]
  })
export class UserModule {}
