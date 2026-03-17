import { APIRequest } from './api-request';

export class BookingStreamService extends APIRequest {
  create(performerId, data) {
    return this.post(`/user-book-stream/${performerId}`, data);
  }

  performerSearch(data) {
    return this.get(
      this.buildUrl('/performer-book-stream', data)
    );
  }

  upcomingBook(data) {
    return this.get(
      this.buildUrl('/performer-book-stream/upcoming', data)
    );
  }

  userSearch(data) {
    return this.get(
      this.buildUrl('/user-book-stream', data)
    );
  }

  approve(id) {
    return this.post(`/performer-book-stream/${id}/approve`);
  }

  reject(id) {
    return this.post(`/performer-book-stream/${id}/reject`);
  }

  delete(id) {
    return this.del(`/user-book-stream/${id}`);
  }

  update(id, data) {
    return this.update(`/user-book-stream/${id}`, data);
  }
}

export const bookingStreamService = new BookingStreamService();
