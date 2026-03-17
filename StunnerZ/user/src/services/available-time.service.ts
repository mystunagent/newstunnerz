import { APIRequest } from './api-request';

export class AvailableTimeStreamService extends APIRequest {
  myCreate(data) {
    return this.post('/set-time/stream', data);
  }

  myUpdate(id, data) {
    return this.put(`/set-time/stream/${id}`, data);
  }

  myDelete(id) {
    return this.del(`/set-time/stream/${id}`);
  }

  myList(data) {
    return this.get(
      this.buildUrl('/set-time/stream', data)
    );
  }

  getDetails(id) {
    return this.get(`/set-time/stream/${id}/details`);
  }

  userSearch(data) {
    return this.get(
      this.buildUrl('/set-time/stream/user-search', data)
    );
  }
}

export const availableTimeStreamService = new AvailableTimeStreamService();
