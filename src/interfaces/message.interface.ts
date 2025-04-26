import { Document, Types } from 'mongoose';

export default interface IMessage extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  text: string;
  image: string;
  isDeleted: boolean;
}