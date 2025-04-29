import { injectable } from 'tsyringe';
import { Document, FilterQuery, MergeType, Types } from 'mongoose';

import Message from '../models/message.model';
import User from '../models/user.model';
import { IMessage, IUser } from '../interfaces';
import { CreateMessageDto } from '../dtos/messages/create-message.dto';
import { UnprocessableEntityException } from '../exceptions';
import { TMessagePopulated } from '../types/message.type';

@injectable()
export class MessagesService {
  async getUsers(currentUserId: string) {
    return User.find({
      _id: { $ne: new Types.ObjectId(currentUserId) },
      isDeleted: false,
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean<Partial<IUser[]>>()
      .exec();
  }

  async getMessagesForMeAndUser(
    currentUserId: Types.ObjectId,
    userId: Types.ObjectId,
    startDate?: Date,
    endDate?: Date,
  ) {
    const query: FilterQuery<IMessage> = {
      $or: [
        { senderId: userId, receiverId: currentUserId },
        { senderId: currentUserId, receiverId: userId },
      ],
      isDeleted: false,
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    return Message.find(query)
      .sort({ createdAt: -1 })
      .lean<IMessage[]>()
      .exec();
  }

  async createMessage(
    senderId: string,
    receiverId: string,
    data: CreateMessageDto,
  ) {
    const message = new Message({
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(receiverId),
      ...data,
      isDeleted: false,
    });

    try {
      const result = await (
        await message.save()
      ).populate<{
        senderId: IUser;
        receiverId: IUser;
      }>({
        path: 'senderId receiverId',
        select: 'fullName email profilePic',
      });

      return this.mapMessageResponse(result);
    } catch (error) {
      throw new UnprocessableEntityException('Message creation failed');
    }
  }

  private mapMessageResponse(
    doc: MergeType<
      Document<unknown, {}, IMessage> &
        IMessage &
        Required<{ _id: unknown }> & { __v: number },
      { senderId: IUser; receiverId: IUser }
    >,
  ) {
    const response: TMessagePopulated = {
      _id: (doc._id as any).toHexString(),
      sender: {
        fullName: doc.senderId.fullName,
        email: doc.senderId.email,
        profilePic: doc.senderId.profilePic,
        _id: (doc.senderId._id as any).toHexString(),
      },
      receiver: {
        fullName: doc.receiverId.fullName,
        email: doc.receiverId.email,
        profilePic: doc.receiverId.profilePic,
        _id: (doc.receiverId._id as any).toHexString(),
      },
      image: doc.image,
      text: doc.text,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      isDeleted: doc.isDeleted,
    };

    return response;
  }
}
