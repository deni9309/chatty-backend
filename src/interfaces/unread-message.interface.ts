import { Document, Types } from 'mongoose';

export default interface IUnreadMessage extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  messageId: Types.ObjectId;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
