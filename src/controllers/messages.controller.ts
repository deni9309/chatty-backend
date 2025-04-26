import { inject, injectable } from 'tsyringe';
import { NextFunction, Response } from 'express';

import { MessagesService } from '../services/messages.service';
import { RequestWithUser } from '../interfaces';

@injectable()
export class MessagesController {
  constructor(
    @inject(MessagesService) private readonly messagesService: MessagesService,
  ) {}

  async getMessages(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      const messages = await this.messagesService.getMessages();

      res.status(200).json(messages);
    } catch (error) {
      next(error);
    }
  }
}
