import { Schema } from 'mongoose';

// todo - add price with media message
// todo - price default is 0
// todo - check dto and interface too
export const MessageSchema = new Schema({
  conversationId: {
    type: Schema.Types.ObjectId,
    index: true
  },
  // text, file, etc...
  type: {
    type: String,
    default: 'text',
    index: true
  },
  fileId: Schema.Types.ObjectId,
  fileType: String, // photo or video
  text: String,
  senderSource: String,
  senderId: Schema.Types.ObjectId,
  meta: Schema.Types.Mixed,
  price: {
    type: Number,
    default: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
