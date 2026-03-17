import { APIRequest } from './api-request';

export class SubAccountService extends APIRequest {
  create(payload: any) {
    return this.post('/sub-performer', payload);
  }

  switchAccount(payload: any) {
    return this.post('/sub-performer/switch-account', payload);
  }

  update(userId: string, payload: any) {
    return this.put(`/sub-performer/${userId}`, payload);
  }

  findById(userId: string) {
    return this.get(`/sub-performer/${userId}/view`);
  }

  grantPrivileges(payload: any) {
    return this.post('/sub-performer/privilege', payload);
  }

  changeTotalCommission(payload: any) {
    return this.post('/sub-performer/privilege/change-total-commission', payload);
  }

  removePrivileges(id: string) {
    return this.del(`/sub-performer/privilege/${id}`);
  }

  getBankingSubPerformer(id: string) {
    return this.get(`/performers/search/banking-settings-sub-performer/${id}`)
  }

  getNameSubAccount() {
    return this.get(`/performers/account-manager/name`);
  }

  search(query?: { [key: string]: any }) {
    return this.get(
      this.buildUrl('/sub-performer/accounts', query)
    );
  }

  searchAccountPrivileges(query?: { [key: string]: any }) {
    return this.get(
      this.buildUrl('/sub-performer/privileges/search', query)
    );
  }

  getMyPrivilege() {
    return this.get(
      this.buildUrl('/performers/privileges/list')
    );
  }
}
export const subAccountService = new SubAccountService();
