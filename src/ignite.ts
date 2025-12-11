import { http } from './http';
import { logger } from './config/logger';

function ignite(): void {
  logger.info('🔥 Igniting application 🔥');

  http();

  logger.info('🚀 Application successfully launched 🚀');
}

export default ignite;
