import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

export function validationMiddleware<T extends object>(
  type: new () => T,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    const dtoInstance = plainToInstance(type, req.body);

    validate(dtoInstance).then((errors) => {
      if (errors?.length > 0) {
        const messageEntries = errors
          .map(
            ({ property, constraints }) =>
              `${property}: ${Object.values(constraints || {})?.[0] || ''}`,
          )
          .flat();

        res.status(400).json({ errors: messageEntries });
      } else {
        req.body = dtoInstance;
        next();
      }
    });
  };
}
