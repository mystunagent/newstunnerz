export interface IError {
  statusCode: number;
  message: string;
}

export interface IContact {
  email: string;
  message: any;
  name: string;
}

export interface ISettings {
  requireEmailVerification: boolean;
  googleClientId: string;
  twitterClientId: string;
  metaKeywords: string;
  metaDescription: string;
  verotelEnabled: boolean;
  agoraEnable: boolean;
  paymentGateway: string;
  transactionCost: number;
  p2pReferralCommission: number;
  p2uReferralCommission: number;
  u2pReferralCommission: number;
  u2uReferralCommission: number;
  advertiseContent: string;
  speedBanner: any;
}
