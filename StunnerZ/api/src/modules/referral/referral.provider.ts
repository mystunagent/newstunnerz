import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { REFERRAL_MODEL_PROVIDER } from './referral.constant';
import { ReferralSchema } from './referral.schema';

export const REACT_MODEL_PROVIDER = 'REACT_MODEL_PROVIDER';

export const referralProviders = [
  {
    provide: REFERRAL_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('Referrals', ReferralSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];
