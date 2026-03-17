import { APIRequest } from './api-request';

export class EarningService extends APIRequest {
  performerStats(param?: any) {
    return this.get(this.buildUrl('/group-earning/performer/stats', param));
  }

  subPerformerStats(param?: any) {
    return this.get(this.buildUrl('/group-earning/sub-performer/stats', param));
  }

  performerSearch(param?: any) {
    return this.get(this.buildUrl('/group-earning/performer/search', param));
  }

  subPerformerSearchEarning(param?: any) {
    return this.get(this.buildUrl('/group-earning/sub-performer/search', param));
  }

  subPerformerSearch(param?: any) {
    return this.get(this.buildUrl('/referral-earnings/sub-performer/search', param));
  }

  referralStats() {
    return this.get('/referral-earnings/stats');
  }

  referralStatsSubPerformer(param?: any) {
    return this.get(this.buildUrl('/referral-earnings/stats/sub-performer', param));
  }

  referralSearch(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/referral-earnings/search', query));
  }

  referralSubPerformerSearch(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/referral-earnings/stats/sub-performer', query));
  }
}

export const earningService = new EarningService();
