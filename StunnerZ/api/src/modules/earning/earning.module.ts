import { Module, forwardRef } from '@nestjs/common';
import { MongoDBModule } from 'src/kernel';
import { TokenTransactionModule } from 'src/modules/token-transaction/token-transaction.module';
import { SocketModule } from '../socket/socket.module';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';
import { PaymentModule } from '../payment/payment.module';
import { SettingModule } from '../settings/setting.module';
import { EarningController } from './controllers/earning.controller';
import { EarningService } from './services/earning.service';
import { earningProviders } from './providers/earning.provider';
import { TransactionEarningListener, HandleDeleteItemListener } from './listeners';
import { UserModule } from '../user/user.module';
import { OrderModule } from '../order/order.module';
import { ReferralEarningService } from './services/referral-earning.service';
import { ReferralModule } from '../referral/referral.module';
import { ReferralEarningController } from './controllers/referral-earning.controller';
import { GroupEarningController } from './controllers/group-earning.controller';
import { GroupEarningService } from './services/group-earning.service';

@Module({
  imports: [
    MongoDBModule,
    SocketModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => SettingModule),
    forwardRef(() => TokenTransactionModule),
    forwardRef(() => OrderModule),
    forwardRef(() => ReferralModule)
  ],
  providers: [
    ...earningProviders,
    EarningService,
    TransactionEarningListener,
    HandleDeleteItemListener,
    ReferralEarningService,
    GroupEarningService
  ],
  controllers: [
    EarningController,
    ReferralEarningController,
    GroupEarningController
  ],
  exports: [...earningProviders, EarningService]
})
export class EarningModule {}
