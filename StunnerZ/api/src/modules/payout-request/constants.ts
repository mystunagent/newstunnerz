/* eslint-disable no-shadow */
export const STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DONE: 'done'
};

export const SOURCE_TYPE = {
  PERFORMER: 'performer',
  SUB_PERFORMER: 'sub_performer',
  AGENT: 'agent',
  USER: 'user'
};

export const PAYOUT_REQUEST_CHANEL = 'PAYOUT_REQUEST_CHANEL';
export const PAYOUT_REQUEST_SUB_CHANEL = 'PAYOUT_REQUEST_SUB_CHANEL';
export enum PAYOUT_REQUEST_EVENT {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED'
}
