import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await authService.login(req.body));
    } catch (err) {
      next(err);
    }
  },
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await authService.register(req.body));
    } catch (err) {
      next(err);
    }
  }
};
