import { APIRequest } from './api-request';

export class UpcomingStreamService extends APIRequest {
  create(data) {
    return this.post('/upcoming/stream', data);
  }

  update(id, data) {
    return this.put(`/upcoming/stream/${id}`, data);
  }

  updateStatus(id) {
    return this.put(`/upcoming/stream/${id}/status-stream`);
  }

  delete(id) {
    return this.del(`/upcoming/stream/${id}`);
  }

  details(id) {
    return this.get(`/upcoming/stream/${id}/details`);
  }

  performerSearch(data) {
    return this.get(
      this.buildUrl('/upcoming/stream', data)
    );
  }

  userSearch(data) {
    return this.get(
      this.buildUrl('/upcoming/stream/user-search', data)
    );
  }
}

export const upcomingStreamService = new UpcomingStreamService();
