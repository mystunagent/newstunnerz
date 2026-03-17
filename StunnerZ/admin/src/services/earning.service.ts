import { IEarningSearch, IGroupEarningUpdatePaidStatus } from 'src/interfaces';
import { APIRequest } from './api-request';

export class EarningService extends APIRequest {
  search(query: IEarningSearch) {
    return this.get(this.buildUrl('/group-earning/admin/search', query as any));
  }

  stats(query: IEarningSearch) {
    return this.get(this.buildUrl('/group-earning/admin/stats', query as any));
  }

  // updatePaidStatus(data: IUpdatePaidStatus) {
  //   return this.post('/earning/admin/update-status', data);
  // }

  // findById(id: string) {
  //   return this.get(`/earning/${id}`);
  // }

  updateGroupEarningStatus(payload: IGroupEarningUpdatePaidStatus) {
    return this.post('/group-earning/admin/update-status', payload);
  }
}

export const earningService = new EarningService();
