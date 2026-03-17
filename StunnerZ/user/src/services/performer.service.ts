import { IPerformer } from 'src/interfaces';
import { APIRequest, IResponse } from './api-request';
import { getGlobalConfig } from './config';

export class PerformerService extends APIRequest {
  search(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/performers/user/search', query));
  }

  searchNoAuth(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/performers/user/search-no-auth', query));
  }

  searchInfoInserted(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/performers/info-inserted/search', query));
  }

  randomSearch(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/performers/search/random', query));
  }

  me(headers?: { [key: string]: string }): Promise<IResponse<IPerformer>> {
    return this.get('/performers/me', headers);
  }

  findOne(id: string, headers?: { [key: string]: string }) {
    return this.get(`/performers/${id}`, headers);
  }

  getAvatarUploadUrl() {
    const config = getGlobalConfig();
    return `${config.NEXT_PUBLIC_API_ENDPOINT}/performers/avatar/upload`;
  }

  getWelcomeMessageUploadUrl() {
    const config = getGlobalConfig();
    return `${config.NEXT_PUBLIC_API_ENDPOINT}/performers/welcome-message/upload`;
  }

  getCoverUploadUrl() {
    const config = getGlobalConfig();
    return `${config.NEXT_PUBLIC_API_ENDPOINT}/performers/cover/upload`;
  }

  getVideoUploadUrl() {
    const config = getGlobalConfig();
    return `${config.NEXT_PUBLIC_API_ENDPOINT}/performers/welcome-video/upload`;
  }

  getDocumentUploadUrl() {
    const config = getGlobalConfig();
    return `${config.NEXT_PUBLIC_API_ENDPOINT}/performers/documents/upload`;
  }

  updateMe(id: string, payload: any) {
    return this.put(`/performers/${id}`, payload);
  }

  getTopPerformer(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/performers/top', query));
  }

  updateBanking(id: string, payload) {
    return this.put(`/performers/${id}/banking-settings`, payload);
  }

  updatePaymentGateway(id, payload) {
    return this.put(`/performers/${id}/payment-gateway-settings`, payload);
  }

  getBookmarked(payload) {
    return this.get(this.buildUrl('/reactions/performers/bookmark', payload));
  }

  checkBlockCountry(username: string) {
    return this.get(`/performers/${username}/check-block-country`);
  }

  checkBlockedByPerformer(username: string) {
    return this.get(`/performers/${username}/check-block-by-performer`);
  }

  getUsernamePerformers(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/performers/user/search/username', query));
  }

  updateManageAccount(by) {
    return this.post('/performers/account-manager/update', by);
  }

  updateBankingManageAccount(id, payload) {
    return this.post(`/performers/account-manager/update-banking/${id}`, payload);
  }

  searchBankingInfo(id) {
    return this.get(`/performers/search/banking-settings/${id}`);
  }

  searchBankingInfoSubPerformer(id) {
    return this.get(`/performers/search/banking-settings-sub-performer/${id}`);
  }

  updatePriceBookStream(price) {
    return this.put('/performers/update-price/booking-stream', price);
  }
}

export const performerService = new PerformerService();
