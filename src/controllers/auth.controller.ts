import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';

import { AuthService } from '../services/auth.service';
import { BadRequestException } from '../exceptions';

@injectable()
export class AuthController {
  constructor(@inject(AuthService) private readonly authService: AuthService) {}

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const existingUser = await this.authService.userExists(req.body.email);
      if (existingUser) {
        throw new BadRequestException('Account with this email already in use');
      }
      
      const user = await this.authService.register(req.body);

      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response) {
    res.send('login route');
  }

  async logout(req: Request, res: Response) {
    res.send('logout route');
  }
}
