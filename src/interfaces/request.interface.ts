import { Request } from 'express';

import { TokenPayload } from '../types/token-payload';

export default interface RequestWithUser extends Request {
  user?: TokenPayload
}