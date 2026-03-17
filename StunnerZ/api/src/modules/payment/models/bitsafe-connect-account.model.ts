import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class BitsafeConnectAccountModel extends Document {
  source: string;

  sourceId: ObjectId;

  platformConnectId: string;

  publicToken: string;

  email: string;

  iban: string;

  signature: string;

  metaData: any;

  createdAt: Date;

  updatedAt: Date;
}
