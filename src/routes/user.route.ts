import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import { userSchema } from '../schemas/user.schema';

export const userRouter = Router();

userRouter.post('/', validate(userSchema.create), userController.create);
userRouter.get('/', userController.list);
userRouter.get('/:id', userController.findById);
