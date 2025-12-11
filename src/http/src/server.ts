import dotenv from 'dotenv';
import { app } from './app';
import { logger } from '../../config/logger';
dotenv.config();

export function startExpressHttpServer(): void{
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });
}
