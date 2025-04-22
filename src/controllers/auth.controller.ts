import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';

import { AuthService } from '../services/auth.service';

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
}
