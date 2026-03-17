import { APIRequest } from './api-request';

export class MessageService extends APIRequest {
  create(payload: any) {
    return this.post('/admin/messages/mass-message', payload);
  }

  uploadMassMessageFile(file: File, payload: any, onProgress?: Function) {
    return this.upload(
      '/admin/messages/mass-message/file/upload',
      [
        {
          fieldname: 'mass-message',
          file
        }
      ],
      {
        onProgress,
        customData: payload
      }
    );
  }

  deleteMassMessageFile(fileId: string) {
    return this.del(`/admin/messages/mass-message/${fileId}`);
  }
}

export const messageService = new MessageService();
