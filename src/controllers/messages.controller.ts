import { inject, injectable } from 'tsyringe';
import { NextFunction, Response } from 'express';
import { Types } from 'mongoose';

import { MessagesService } from '../services/messages.service';
import { RequestWithUser } from '../interfaces';
import { BadRequestException, UnauthorizedException } from '../exceptions';

@injectable()
export class MessagesController {
  constructor(
    @inject(MessagesService) private readonly messagesService: MessagesService,
  ) {}

  async getUsers(req: RequestWithUser, res: Response, next: NextFunction) {
    const currentUserId = req.user?._id;
    if (!currentUserId) {
      throw new UnauthorizedException();
    }

    try {
      const users = await this.messagesService.getUsers(currentUserId);
      res.status(200).json(users);
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

    const { startDate, endDate } = req.query;

    try {
      const userMessages = await this.messagesService.getMessagesForMeAndUser(
        new Types.ObjectId(currentUserId),
        new Types.ObjectId(userId),
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
}
