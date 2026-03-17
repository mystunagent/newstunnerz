import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule, QueueModule } from 'src/kernel';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { FileModule } from '../file/file.module';
import { PerformerModule } from '../performer/performer.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { conversationProviders, messageProviders, notificationMessageProviders } from './providers';
import { SocketModule } from '../socket/socket.module';
import { MessageListener, DeleteUserMessageListener, WelcomeMessageListener } from './listeners';
import { ConversationService, MessageService, NotificationMessageService } from './services';
import { ConversationController } from './controllers/conversation.controller';
import { MessageController } from './controllers/message.controller';
import { BlockModule } from '../block/block.module';
import { UtilsModule } from '../utils/utils.module';
import { StreamModule } from '../stream/stream.module';
import { TokenTransactionModule } from '../token-transaction/token-transaction.module';
import { AdminMessageController } from './controllers/admin-message.controller';

@Module({
  imports: [
    MongoDBModule,
    QueueModule.forRoot(),
    SocketModule,
    forwardRef(() => UserModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => AuthModule),
    forwardRef(() => UtilsModule),
    forwardRef(() => FileModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => BlockModule),
    forwardRef(() => StreamModule),
    forwardRef(() => TokenTransactionModule)
  ],
  providers: [
    ...messageProviders,
    ...conversationProviders,
    ...notificationMessageProviders,
    ConversationService,
    MessageService,
    NotificationMessageService,
    MessageListener,
    DeleteUserMessageListener,
    WelcomeMessageListener
  ],
  controllers: [ConversationController, MessageController, AdminMessageController],
  exports: [ConversationService, MessageService]
})
export class MessageModule { }
