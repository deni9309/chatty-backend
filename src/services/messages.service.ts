import { injectable } from 'tsyringe';
import { Document, FilterQuery, MergeType, Types } from 'mongoose';

import Message from '../models/message.model';
import User from '../models/user.model';
import { IMessage, IUnreadMessage, IUser } from '../interfaces';
import { CreateMessageDto } from '../dtos/messages/create-message.dto';
import { UnprocessableEntityException } from '../exceptions';
import { TMessage, TMessagePopulated } from '../types/message.type';
import { getOnlineUserIds, getReceiverSocketId, io } from '../lib/socket-io';
import UnreadMessage from '../models/unread-message.model';
import GetUsersParams from '../interfaces/get-user-params.interface';

@injectable()
export class MessagesService {
  async getUsers({ currentUserId, page, limit, search }: GetUsersParams) {
    const skip = (page - 1) * limit;
    const query: FilterQuery<IUser> = {
      _id: { $ne: new Types.ObjectId(currentUserId) },
      isDeleted: false,
    };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<Partial<IUser[]>>()
        .exec(),
      User.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasMore: page < totalPages,
      },
    };
  }

  async getMessagesForMeAndUser(
    currentUserId: Types.ObjectId,
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 20,
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

    const skip = (page - 1) * limit;
    const [messages, totalCount] = await Promise.all([
      Message.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IMessage[]>()
        .exec(),
      Message.countDocuments(query).exec(),
    ]);

    return {
      messages: messages.reverse(),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + messages.length < totalCount,
      },
    };
  }

  async createMessage(
    senderId: string,
    receiverId: string,
    data: CreateMessageDto,
  ) {
    const message = new Message({
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(receiverId),
      text: data.text || '',
      image: data.image || '',
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

      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit(
          'new_message',
          this.mapMessageForSubscriptionResponse(result),
        );
      }

      const isReceiverOnline = getOnlineUserIds().includes(receiverId);
      if (!isReceiverOnline) {
        await UnreadMessage.create({
          senderId: new Types.ObjectId(senderId),
          receiverId: new Types.ObjectId(receiverId),
          messageId: message._id,
          isDeleted: false,
          isRead: false,
        });
      }

      return this.mapMessageResponse(result);
    } catch (error) {
      console.log(error);
      throw new UnprocessableEntityException('Message creation failed');
    }
  }

  async getMineUnreadMessages(receiverId: string) {
    return UnreadMessage.find({
      receiverId: new Types.ObjectId(receiverId),
      isDeleted: false,
      isRead: false,
    })
      .lean<IUnreadMessage[]>()
      .exec();
  }

  async markMineMessagesFromSenderAsRead(senderId: string, receiverId: string) {
    return UnreadMessage.updateMany(
      {
        senderId: new Types.ObjectId(senderId),
        receiverId: new Types.ObjectId(receiverId),
        isDeleted: false,
        isRead: false,
      },
      { isRead: true },
    ).exec();
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

  private mapMessageForSubscriptionResponse(
    doc: MergeType<
      Document<unknown, {}, IMessage> &
        IMessage &
        Required<{ _id: unknown }> & { __v: number },
      { senderId: IUser; receiverId: IUser }
    >,
  ) {
    const response: TMessage = {
      _id: (doc._id as any).toHexString(),
      senderId: (doc.senderId._id as any).toHexString(),
      receiverId: (doc.receiverId._id as any).toHexString(),
      image: doc.image,
      text: doc.text,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      isDeleted: doc.isDeleted,
    };

    return response;
  }
}
