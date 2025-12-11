import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

export const userController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await userService.create(req.body));
    } catch (err) {
      next(err);
    }
  },
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await userService.list());
    } catch (err) {
      next(err);
    }
  },
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await userService.findById(req.params.id ?? ''));
    } catch (err) {
      next(err);
    }
  }
};
