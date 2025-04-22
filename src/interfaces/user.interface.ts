import { Document } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  profilePic: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}