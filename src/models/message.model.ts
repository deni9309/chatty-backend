import { Schema, model } from 'mongoose';
import { IMessage } from '../interfaces';

const messageSchema = new Schema<IMessage>(
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
    text: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Message = model<IMessage>('Message', messageSchema);

export default Message;
