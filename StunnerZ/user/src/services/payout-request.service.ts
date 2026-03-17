import { APIRequest } from './api-request';

class PayoutRequestService extends APIRequest {
  calculate(isPerformer = false) {
    return this.post(`/payout-requests/${isPerformer ? '' : 'user/'}calculate`);
  }

  subPerformerCalculate(data?: any) {
    return this.post('/payout-requests/sub-performer/calculate', data);
  }

  search(query: { [key: string]: any }) {
    return this.get(this.buildUrl('/payout-requests/user/search', query));
  }

  subPerformerSearch(query: { [key: string]: any }) {
    return this.get(this.buildUrl('/payout-requests/sub-performer/search', query));
  }

  create(body: any) {
    return this.post('/payout-requests', body);
  }

  subCreate(body: any) {
    return this.post('/payout-requests/sub-performer', body);
  }

  update(id: string, body: any) {
    return this.put(`/payout-requests/${id}`, body);
  }

  subUpdate(id: string, body: any) {
    return this.put(`/payout-requests/${id}/sub-performer`, body);
  }

  detail(
    id: string,
    headers: {
      [key: string]: string;
    }
  ): Promise<any> {
    return this.get(`/payout-requests/${id}/view`, headers);
  }

  subDetail(id: string, data) {
    return this.post(`/payout-requests/${id}/sub-performer/view`, data);
  }

  updatePayoutMethod(key: string, payload: any) {
    return this.post(`/payout-methods/${key}`, payload);
  }

  getPayoutMethod(key: string) {
    return this.get(`/payout-methods/${key}`);
  }

  checkType() {
    return this.get('/payout-requests/performer/allow-type');
  }
}

export const payoutRequestService = new PayoutRequestService();
