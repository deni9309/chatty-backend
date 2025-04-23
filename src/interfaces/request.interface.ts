import { Request } from 'express';

import { TokenPayload } from '../types/token-payload';

export interface RequestWithUser extends Request {
  user?: TokenPayload
}