import { Request, Response, NextFunction } from 'express';

import { HttpException } from '../exceptions';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof HttpException) {
    res.status(err.status).json({ message: err.message });
  } else {
    console.error('Unexpected error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
