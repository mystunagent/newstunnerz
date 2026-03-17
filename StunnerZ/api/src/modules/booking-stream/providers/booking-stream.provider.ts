import { Connection } from 'mongoose';
import { MONGO_DB_PROVIDER } from 'src/kernel';
import { BOOKING_STREAM_PROVIDER, SET_TIME_BOOKING_STREAM_PROVIDER, UPCOMING_STREAM_PROVIDER } from '../constants';
import { BookingStreamSchema, SetUpTimeStreamSchema, UpcomingStreamSchema } from '../schemas';

export const bookingStreamProviders = [
  {
    provide: BOOKING_STREAM_PROVIDER,
    useFactory: (connection: Connection) => connection.model('Book-stream', BookingStreamSchema),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: SET_TIME_BOOKING_STREAM_PROVIDER,
    useFactory: (connection: Connection) => connection.model('Set-time-book-stream', SetUpTimeStreamSchema),
    inject: [MONGO_DB_PROVIDER]
  },
  {
    provide: UPCOMING_STREAM_PROVIDER,
    useFactory: (connection: Connection) => connection.model('Upcoming-time-stream', UpcomingStreamSchema),
    inject: [MONGO_DB_PROVIDER]
  }
];
