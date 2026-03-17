import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

export class SubPerformerPrivilege extends Document {
  userId: ObjectId;

  privilege: string;

  status: string;

  commission: number;

  showCommission: boolean;
}
