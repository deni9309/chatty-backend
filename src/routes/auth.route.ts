import express from 'express';
import { container } from 'tsyringe';
import { AuthController } from '../controllers/auth.controller';
import { validationMiddleware } from '../middleware/validation.middleware';
import { RegisterDto } from '../dtos/auth/register.dto';
import { LoginDto } from '../dtos/auth/login.dto';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const authController = container.resolve(AuthController);

router.post(
  '/register',
  validationMiddleware(RegisterDto),
  authController.register.bind(authController),
);

router.post(
  '/login',
  validationMiddleware(LoginDto),
  authController.login.bind(authController),
);

router.post('/logout', authController.logout.bind(authController));

router.get(
  '/me',
  authMiddleware,
  authController.getCurrentUser.bind(authController),
);

export default router;
