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
  } else if (
    err instanceof Error &&
    (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')
  ) {
    res.status(401).json({ message: 'Invalid or expired token' });
  } else if (
    err &&
    typeof err === 'object' &&
    'http_code' in err &&
    'message' in err
  ) {
    res.status(Number(err.http_code)).json({ message: err.message });
  } else {
    console.error('Unexpected error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
