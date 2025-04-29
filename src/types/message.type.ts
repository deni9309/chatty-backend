import { TUser } from './user.type';

export type TMessage = {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
};

export type TMessagePopulated = {
  _id: string;
  sender: {
    _id: string;
    fullName: string;
    email: string;
    profilePic?: string;
  };
  receiver: {
    _id: string;
    fullName: string;
    email: string;
    profilePic?: string;
  };
  text: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
};
