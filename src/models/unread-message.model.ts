import { Schema, model } from 'mongoose';
import { IUnreadMessage } from '../interfaces';

const unreadMessageSchema = new Schema<IUnreadMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    messageId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Message',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const UnreadMessage = model<IUnreadMessage>(
  'UnreadMessage',
  unreadMessageSchema,
);

export default UnreadMessage;
