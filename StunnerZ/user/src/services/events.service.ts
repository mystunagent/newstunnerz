import { APIRequest } from './api-request';

export class EventService extends APIRequest {
  search(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/events/search', query));
  }

  searchBookEvent(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/events/performer-book/search', query));
  }

  details(id: string) {
    return this.get(`/events/${id}/view`);
  }

  bookEvent(id: any) {
    return this.post('/events/performer-book', id);
  }
}

export const eventService = new EventService();
