import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

export function validationMiddleware<T extends object>(
  type: new () => T,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    const dtoInstance = plainToInstance(type, req.body);
   
    validate(dtoInstance).then((errors) => {
      if (errors.length > 0) {
        const messages = errors
          .map((error) => Object.values(error.constraints || {}))
          .flat();
        
        res.status(400).json({ errors: messages });
      } else {
        req.body = dtoInstance;
        next();
      }
    });
  };
}
