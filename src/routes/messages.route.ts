import { Router } from 'express';
import { container } from 'tsyringe';

import { MessagesController } from '../controllers/messages.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  uploadMessageImage,
  uploadMessageImageMiddleware,
} from '../middleware/upload.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { CreateMessageDto } from '../dtos/messages/create-message.dto';

const router = Router();
const messagesController = container.resolve(MessagesController);

router.get(
  '/users',
  authMiddleware,
  messagesController.getUsers.bind(messagesController),
);

router.get(
  '/mine-and/:id',
  authMiddleware,
  messagesController.getMineAndForUser.bind(messagesController),
);

router.post(
  '/send/:id',
  authMiddleware,
  uploadMessageImage,
  uploadMessageImageMiddleware,
  validationMiddleware(CreateMessageDto),
  messagesController.create.bind(messagesController),
);

export default router;
