import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class MessageModel extends Document {
  conversationId: ObjectId;

  type: string;

  fileId?: ObjectId;

  fileType?: string;

  text: string;

  senderSource: string;

  senderId: ObjectId;

  meta?: any;

  price?: number;

  isPaid?: boolean;

  createdAt?: Date;

  updatedAt?: Date;
}
