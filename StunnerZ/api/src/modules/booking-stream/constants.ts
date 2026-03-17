import * as moment from 'moment';

// eslint-disable-next-line no-shadow
export enum BookingStreamStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum SearchBookingStreamStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export const BOOKING_STREAM_STATUES = [
  BookingStreamStatus.PENDING,
  BookingStreamStatus.APPROVED,
  BookingStreamStatus.REJECTED
];

export const SEARCH_BOOKING_STREAM_STATUES = [
  SearchBookingStreamStatus.PENDING,
  SearchBookingStreamStatus.APPROVED,
  SearchBookingStreamStatus.REJECTED
];

// eslint-disable-next-line no-shadow
export enum SetUpTimeStreamStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BOOKED = 'booked',
}

export enum SearchSetUpTimeStreamStatus {
  EMPTY = '',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BOOKED = 'booked',
  EXPIRED = 'expired'
}

export const SETUP_TIME_STREAM_STATUES = [
  SetUpTimeStreamStatus.ACTIVE,
  SetUpTimeStreamStatus.INACTIVE,
  SetUpTimeStreamStatus.BOOKED
];

export const SEARCH_SETUP_TIME_STREAM_STATUES = [
  SearchSetUpTimeStreamStatus.EMPTY,
  SearchSetUpTimeStreamStatus.ACTIVE,
  SearchSetUpTimeStreamStatus.INACTIVE,
  SearchSetUpTimeStreamStatus.BOOKED,
  SearchSetUpTimeStreamStatus.EXPIRED
];

// eslint-disable-next-line no-shadow
export enum UpcomingTimeStreamStatus {
  PENDING = 'pending',
  STREAMED = 'streamed'
}

export const UPCOMING_TIME_STREAM_STATUES = [
  UpcomingTimeStreamStatus.PENDING,
  UpcomingTimeStreamStatus.STREAMED
];

export const SET_TIME_BOOKING_STREAM_PROVIDER = 'SET_TIME_BOOKING_STREAM_PROVIDER';
export const BOOKING_STREAM_PROVIDER = 'BOOKING_STREAM_PROVIDER';
export const BOOKING_STREAM_REMINDER = 'BOOKING_STREAM_REMINDER';
export const BOOKING_STREAM_CONFIRMATION = 'BOOKING_STREAM_CONFIRMATION';
export const UPCOMING_STREAM_PROVIDER = 'UPCOMING_STREAM_PROVIDER';
export const SCHEDULE_APPROVE_BOOK_STREAM_AGENDA = 'SCHEDULE_APPROVE_BOOK_STREAM_AGENDA';
export const SCHEDULE_UPCOMING_AGENDA = 'SCHEDULE_UPCOMING_AGENDA';
export function formatDateNotSecond(date: Date, format = 'DD/MM/YYYY HH:mm') {
  return moment(date).format(format);
}
