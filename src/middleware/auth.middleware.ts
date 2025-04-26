import { container } from 'tsyringe';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { AuthService } from '../services/auth.service';
import { RequestWithUser } from '../interfaces';
import { TokenPayload } from '../types/token-payload';
import { UnauthorizedException } from '../exceptions';

export async function authMiddleware(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  const authService = container.resolve(AuthService);

  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.split(' ')[1];
  const tokenFromCookie = req.cookies?.jwt;

  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    throw new UnauthorizedException('Missing token');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    const email = (payload as TokenPayload).email;
    const user = await authService.verifyUser(email);

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
