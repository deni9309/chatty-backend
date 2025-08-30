import { inject, injectable } from 'tsyringe';
import { NextFunction, Response } from 'express';
import { Types } from 'mongoose';

import { MessagesService } from '../services/messages.service';
import { RequestWithUser } from '../interfaces';
import { BadRequestException, UnauthorizedException } from '../exceptions';
import { MESSAGE_PAGE_SIZE } from '../constants/message.constants';
import { USER_PAGE_SIZE } from '../constants/user.constants';

@injectable()
export class MessagesController {
  constructor(
    @inject(MessagesService) private readonly messagesService: MessagesService,
  ) {}

  async getUsers(req: RequestWithUser, res: Response, next: NextFunction) {
    const currentUserId = req.user?._id;
    if (!currentUserId) return next(new UnauthorizedException());

    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || USER_PAGE_SIZE;
      const search = (req.query.search as string) || '';

      const onlineOnly = (req.query.onlineOnly as string) === 'true';

      const result = await this.messagesService.getUsers({
        currentUserId,
        page,
        limit,
        search,
        onlineOnly,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMineAndForUser(
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ) {
    const currentUserId = req.user?._id;
    if (!currentUserId) throw new UnauthorizedException();

    const userId = req.params.id;
    if (!userId || !Types.ObjectId.isValid(userId))
      throw new BadRequestException('User ID is not valid or missing');

    const {
      startDate,
      endDate,
      page = '1',
      limit = MESSAGE_PAGE_SIZE,
    } = req.query;

    try {
      const userMessages = await this.messagesService.getMessagesForMeAndUser(
        new Types.ObjectId(currentUserId),
        new Types.ObjectId(userId),
        parseInt(page as string),
        parseInt(limit as string),
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
      );

      res.status(200).json(userMessages);
    } catch (error) {
      next(error);
    }
  }

  async create(req: RequestWithUser, res: Response, next: NextFunction) {
    const receiverId = req.params.id;
    if (!receiverId || !Types.ObjectId.isValid(receiverId))
      throw new BadRequestException('User ID is not valid or missing');

    const currentUserId = req.user?._id;
    if (!currentUserId) throw new UnauthorizedException();

    if (!req.body?.image && !req.body?.text)
      throw new BadRequestException('Text or image is required');

    try {
      const message = await this.messagesService.createMessage(
        currentUserId,
        receiverId,
        req.body,
      );

      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }

  async getMineUnreadMessages(
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ) {
    const currentUserId = req.user?._id; // receiverId
    if (!currentUserId) throw new UnauthorizedException();

    try {
      const unreadMessages =
        await this.messagesService.getMineUnreadMessages(currentUserId);

      res.status(200).json(unreadMessages);
    } catch (error) {
      next(error);
    }
  }

  async markMineMessagesFromSenderAsRead(
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ) {
    const currentUserId = req.user?._id; // receiverId
    if (!currentUserId) throw new UnauthorizedException();

    const senderId = req.params.senderId;
    if (!senderId || !Types.ObjectId.isValid(senderId)) {
      throw new BadRequestException('Sender ID is not valid or missing');
    }

    try {
      await this.messagesService.markMineMessagesFromSenderAsRead(
        senderId,
        currentUserId,
      );

      res.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
      next(error);
    }
  }
}
