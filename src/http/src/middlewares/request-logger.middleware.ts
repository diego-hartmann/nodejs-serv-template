import morgan from 'morgan';
import { logger } from '../../../config/logger';

export const requestLoggerMiddleware = morgan('tiny', {
  stream: {
    write: (msg) => logger.info(msg.trim())
  }
});
