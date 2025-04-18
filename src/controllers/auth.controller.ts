import { Request, Response } from 'express';

export const register = (req: Request, res: Response) => {
  res.send('register route');
};

export const login = (req: Request, res: Response) => {
  res.send('login route');
};

export const logout = (req: Request, res: Response) => {
  res.send('logout route');
};
