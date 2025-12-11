import type express from 'express';
import { type ErrorRequestHandler } from 'express';
import { HTTP_ERROR, HttpErrorHandler } from '../../../utils/http-error.util';

const createErrorInstance = (err: unknown): HttpErrorHandler => {
  if (err instanceof HttpErrorHandler) return err;

  if (err instanceof Error) return HTTP_ERROR.internalError(err.message);

  return HTTP_ERROR.internalError(`Unknown error: ${JSON.stringify(err)}`);
};

export const errorHandlerMiddleware: ErrorRequestHandler = (
  err: unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  req: express.Request,
  res: express.Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: express.NextFunction
): void => {
  const httpError = createErrorInstance(err);

  // logger.error(sanitize(`${req.method} ${req.originalUrl} -> ${httpError.status}: ${httpError.message}`));

  res.status(httpError.status).json({ message: httpError.message });
};
