import { APIRequest } from './api-request';

class StreamService extends APIRequest {
  updateStreamInfo(payload) {
    return this.put('/streaming/update', payload);
  }

  updateStreamDuration(payload) {
    return this.put('/streaming/set-duration', payload);
  }

  goLive(data) {
    return this.post('/streaming/live', data);
  }

  editLive(id, data) {
    return this.put(`/streaming/live/${id}`, data);
  }

  searchLive(streamId: string) {
    return this.get(`/streaming/live/search/${streamId}`);
  }

  autoUpdateStats(id, total) {
    return this.put(`/streaming/update-live/${id}`, total);
  }

  joinPublicChat(performerId: string, headers?: any) {
    return this.post(`/streaming/join/${performerId}`, headers);
  }

  fetchAgoraAppToken(data) {
    return this.post('/streaming/agora/token', data);
  }

  search(query: { [key: string]: any }) {
    return this.get(this.buildUrl('/streaming/user/search', query));
  }

  getPrivateList() {
    return this.get('/streaming/private/available-list');
  }

  removeAllRequest() {
    return this.post('/streaming/private/remove-request');
  }

  userRemoveRequest(performerId) {
    return this.post('/streaming/private/user-remove-request', performerId);
  }

  modelSendNotifyAcceptPrivateChat(conversationId) {
    return this.post('/streaming/private/notify-model-accept', conversationId);
  }

  sendNotifyModelJoinRoomPrivate(id) {
    return this.post('/streaming/private/send-notify-join-room', id);
  }

  sendNotifyUserJoinBookingRoom(id) {
    return this.post('/streaming/private/user-join-booking-room', id);
  }

  sendNotifyModelLeftRoomPrivate(id) {
    return this.post('/streaming/private/send-notify-left-room', id);
  }

  sendNotifyUserLeftRoomPrivate(id) {
    return this.post('/streaming/private/send-notify-user-left-room', id);
  }

  requestPrivateChat(performerId: string) {
    return this.post(`/streaming/private-chat/${performerId}`);
  }

  getPrivateChat(performerId: string) {
    return this.get(`/streaming/private-chat/check-stream/${performerId}`);
  }

  acceptPrivateChat(id: string) {
    return this.get(`/streaming/private-chat/accept-request/${encodeURIComponent(id)}`);
  }

  getBookPrivateChat(id: string, headers?: any) {
    return this.get(`/streaming/private-chat/join-booking/${encodeURIComponent(id)}`, headers);
  }

  finishBookPrivateChat(id: string) {
    return this.post(`/streaming/private-chat/finish-booking/${encodeURIComponent(id)}`);
  }

  rejectPrivateChat(id: string) {
    return this.del(`/streaming/private-chat/reject-request/${encodeURIComponent(id)}`);
  }

  getMemberRoomBooking(id) {
    return this.get(`/streaming/booking-chat/get-member/${id}`);
  }
}

export const streamService = new StreamService();
