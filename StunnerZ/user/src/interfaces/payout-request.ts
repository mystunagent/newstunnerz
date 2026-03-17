/* eslint-disable no-shadow */
export type PaymentAccount =
  | 'wire'
  | 'banking';
export type PayoutStatus = 'pending' | 'approved' | 'rejected' | 'done';

export interface PayoutRequestInterface {
  _id: string;
  sourceId: string;
  source: string;
  paymentAccountType: PaymentAccount;
  requestNote: string;
  adminNote: string;
  status: PayoutStatus;
  requestTokens: number;
  createdAt: Date;
  updatedAt: Date;
}
