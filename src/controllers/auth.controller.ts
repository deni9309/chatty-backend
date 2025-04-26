import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { Types } from 'mongoose';

import { AuthService } from '../services/auth.service';
import { RequestWithUser } from '../interfaces';
import { NotFoundException } from '../exceptions';

@injectable()
export class AuthController {
  constructor(@inject(AuthService) private readonly authService: AuthService) {}

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.authService.register(req.body, res);

      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.authService.login(req.body, res);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      res.cookie('jwt', '', { maxAge: 0 });
      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const _id = req.user?._id && new Types.ObjectId(req.user._id);
      const user = await this.authService.findOne({ _id });

      if (!user) {
        throw new NotFoundException('User not found');
      }
      const userResponse = this.authService.mapUserResponse(user!);
      res.status(200).json(userResponse);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      const userId = req.user?._id ?? '';

      const user = await this.authService.updateUser(userId, req.body);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}
