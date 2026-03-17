import { APIRequest } from './api-request';

export class PaymentService extends APIRequest {
  subscribePerformer(payload: any) {
    return this.post('/payment/subscribe/performers', payload);
  }

  userSearch(payload) {
    return this.get(this.buildUrl('/transactions/user/search', payload));
  }

  addFunds(payload: any) {
    return this.post('/payment/wallet/top-up', payload);
  }

  applyCoupon(code: any) {
    return this.post(`/coupons/${code}/apply-coupon`);
  }
}

export const paymentService = new PaymentService();
