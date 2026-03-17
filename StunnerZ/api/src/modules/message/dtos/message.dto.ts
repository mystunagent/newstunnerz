import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class MessageDto {
  _id: ObjectId;

  conversationId: ObjectId;

  type: string;

  fileId: ObjectId;

  text: string;

  senderId: ObjectId;

  meta: any;

  createdAt: Date;

  updatedAt: Date;

  imageUrl?: string;

  fileUrl?: string;

  fileType?: string;

  thumbnailUrls?: string[];

  isPaid?: boolean;

  price?: number;

  senderInfo?: any

  constructor(data?: Partial<MessageDto>) {
    Object.assign(this, pick(data, [
      '_id', 'conversationId', 'type', 'fileId', 'imageUrl', 'senderInfo', 'fileType',
      'text', 'senderId', 'meta', 'createdAt', 'updatedAt', 'fileUrl', 'isPaid', 'price'
    ]));
  }
}
