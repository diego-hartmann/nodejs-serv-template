import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authSchema } from '../schemas/auth.schema';

export const authRouter = Router();

authRouter.post('/login', validate(authSchema.login), authController.login);
authRouter.post('/register', validate(authSchema.register), authController.register);
