import express from 'express';
import { container } from 'tsyringe';
import { AuthController } from '../controllers/auth.controller';
import { validationMiddleware } from '../middleware/validation.middleware';
import { RegisterDto } from '../dtos/auth/register.dto';

const router = express.Router();
const authController = container.resolve(AuthController);

router.post(
  '/register',
  validationMiddleware(RegisterDto),
  authController.register,
);

router.post('/login', authController.login);

router.post('/logout', authController.logout);

export default router;
