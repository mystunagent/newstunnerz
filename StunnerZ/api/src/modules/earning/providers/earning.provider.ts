import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { EarningSchema } from '../schemas/earning.schema';
import { ReferralEarningSchema } from '../schemas/referral-earning.schema';
import { GroupEarningSchema } from '../schemas/group-earning.schema';

export const EARNING_MODEL_PROVIDER = 'EARNING_MODEL_PROVIDER';

export const REFERRAL_EARNING_MODEL_PROVIDER = 'REFERRAL_EARNING_MODEL_PROVIDER';

export const GROUP_EARNING_MODEL_PROVIDER = 'GROUP_EARNING_MODEL_PROVIDER';

export const earningProviders = [
  {
    provide: EARNING_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('Earning', EarningSchema),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: REFERRAL_EARNING_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('ReferralEarnings', ReferralEarningSchema) as any,
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: GROUP_EARNING_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('GroupEarnings', GroupEarningSchema) as any,
    inject: [MONGO_DB_PROVIDER]
  }
];
