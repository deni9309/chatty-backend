import { Router } from 'express';
import { container } from 'tsyringe';
import { AuthController } from '../controllers/auth.controller';
import { validationMiddleware } from '../middleware/validation.middleware';
import { RegisterDto } from '../dtos/auth/register.dto';
import { LoginDto } from '../dtos/auth/login.dto';
import { authMiddleware } from '../middleware/auth.middleware';
import { UpdateUserDto } from '../dtos/auth/update-user.dto';
import {
  uploadProfilePic,
  uploadToCloudinary,
} from '../middleware/upload.middleware';

const router = Router();
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

router.put(
  '/update',
  authMiddleware,
  uploadProfilePic,
  uploadToCloudinary,
  validationMiddleware(UpdateUserDto),
  authController.updateUser.bind(authController),
);

export default router;
