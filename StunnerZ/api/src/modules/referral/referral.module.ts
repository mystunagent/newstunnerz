import { Module, forwardRef } from '@nestjs/common';
import { Connection } from 'mongoose';
import { MongoDBModule, MONGO_DB_PROVIDER } from 'src/kernel';
import { UserModule } from '../user/user.module';
import { PerformerModule } from '../performer/performer.module';
import { AuthModule } from '../auth/auth.module';
import { ReferralSchema, ReferralCodeSchema } from './referral.schema';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';
import { REFERRAL_MODEL_PROVIDER, REFERRAL_CODE_MODEL_PROVIDER } from './referral.constant';

@Module({
  imports: [
    MongoDBModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => PerformerModule)
  ],
  providers: [
    {
      provide: REFERRAL_MODEL_PROVIDER,
      useFactory: (connection: Connection) => connection.model('Referrals', ReferralSchema),
      inject: [MONGO_DB_PROVIDER]
    },
    {
      provide: REFERRAL_CODE_MODEL_PROVIDER,
      inject: [MONGO_DB_PROVIDER],
      useFactory: (connection: Connection) => connection.model('ReferralCodes', ReferralCodeSchema)
    },
    ReferralService
  ],
  controllers: [
    ReferralController
  ],
  exports: [
    ReferralService
  ]
})
export class ReferralModule {}
