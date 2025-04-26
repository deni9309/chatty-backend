import { Router } from 'express';
import { container } from 'tsyringe';

import { MessagesController } from '../controllers/messages.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const messagesController = container.resolve(MessagesController);

router.get(
  '/all',
  authMiddleware,
  messagesController.getMessages.bind(messagesController),
);

export default router;
