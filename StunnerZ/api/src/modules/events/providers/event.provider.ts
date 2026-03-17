import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { BookEventSchema, EventSchema } from '../schemas';

export const EVENT_PROVIDER = 'EVENT_PROVIDER';
export const BOOK_EVENT_PROVIDER = 'BOOK_EVENT_PROVIDER';

export const eventProvider = [
  {
    provide: EVENT_PROVIDER,
    useFactory: (connection: Connection) => connection.model('EventsListing', EventSchema),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: BOOK_EVENT_PROVIDER,
    useFactory: (connection: Connection) => connection.model('BookEventsList', BookEventSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];
