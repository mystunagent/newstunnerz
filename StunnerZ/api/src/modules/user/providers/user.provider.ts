import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { UserSchema } from '../schemas/user.schema';
import { SubPerformerPrivilegeSchema } from '../schemas/sub-performer-privileges.schema';

export const USER_MODEL_PROVIDER = 'USER_MODEL';
export const SUB_PERFORMER_PRIVILEGE_PROVIDER = 'SUB_PERFORMER_PRIVILEGE_PROVIDER';

export const userProviders = [
  {
    provide: USER_MODEL_PROVIDER,
    useFactory: (connection: Connection) => connection.model('User', UserSchema),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: SUB_PERFORMER_PRIVILEGE_PROVIDER,
    useFactory: (connection: Connection) => connection.model('SubPerformerPrivilege', SubPerformerPrivilegeSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];
