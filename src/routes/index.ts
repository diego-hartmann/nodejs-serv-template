import { Router } from 'express';
import { healthRouter } from './health.route';
import { userRouter } from './user.route';
import { authRouter } from './auth.route';

export const routes = Router();

routes.use('/health', healthRouter);
routes.use('/users', userRouter);
routes.use('/auth', authRouter);
