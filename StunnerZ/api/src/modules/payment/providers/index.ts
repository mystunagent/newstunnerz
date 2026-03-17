import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import {
  PaymentTransactionSchema, BitsafeAccountConnectSchema
} from '../schemas';

export const PAYMENT_TRANSACTION_MODEL_PROVIDER = 'PAYMENT_TRANSACTION_MODEL_PROVIDER';
export const BITSAFE_ACCOUNT_CONNECT_MODEL_PROVIDER = 'BITSAFE_ACCOUNT_CONNECT_MODEL_PROVIDER';

export const paymentProviders = [
  {
    provide: PAYMENT_TRANSACTION_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('PaymentTransaction', PaymentTransactionSchema),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: BITSAFE_ACCOUNT_CONNECT_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('BitsafeConnectAccounts', BitsafeAccountConnectSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];
