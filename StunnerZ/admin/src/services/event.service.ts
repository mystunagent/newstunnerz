import { APIRequest } from './api-request';

export class EventsService extends APIRequest {
  search(query?: any) {
    return this.get(this.buildUrl('/admin/events', query));
  }

  searchPerformerBook(query?: any) {
    return this.get(this.buildUrl('/admin/events/performer-book/search', query));
  }

  approveEvent(id) {
    return this.post(`/admin/events/booking/approved`, id);
  }

  rejectEvent(id) {
    return this.post(`/admin/events/booking/rejected`, id);
  }

  getDetail(id: string) {
    return this.get(`/admin/events/${id}/view`);
  }

  create(payload: any) {
    return this.post('/admin/events', payload);
  }

  createEvent(
    files: [{ fieldname: string; file: File }],
    payload: any,
    onProgress?: Function
  ) {
    return this.upload('/admin/events', files, {
      onProgress,
      customData: payload
    });
  }

  update(
    id: string,
    files: [{ fieldname: string; file: File }],
    payload: any,
    onProgress?: Function
  ) {
    return this.upload(`/admin/events/${id}`, files, {
      onProgress,
      customData: payload,
      method: 'PUT'
    });
  }

  delete(id: string) {
    return this.del(`/admin/events/${id}`);
  }
}

export const eventsService = new EventsService();
