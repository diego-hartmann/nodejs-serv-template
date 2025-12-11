import { HTTP_STATUS } from './http-response.util';

export class HttpErrorHandler extends Error {
  constructor(
    readonly status: HTTP_STATUS,
    message: string
  ) {
    super(message);
    Object.setPrototypeOf(this, HttpErrorHandler.prototype);
    Error.captureStackTrace(this, HttpErrorHandler);
  }
}

export const HTTP_ERROR = {
  unauthorized: (message: string) => new HttpErrorHandler(HTTP_STATUS.UNAUTHORIZED, message),
  paymentRequired: (message: string) => new HttpErrorHandler(HTTP_STATUS.PAYMENT_REQUIRED, message),
  forbidden: (message: string) => new HttpErrorHandler(HTTP_STATUS.FORBIDDEN, message),
  notFound: (message: string) => new HttpErrorHandler(HTTP_STATUS.NOT_FOUND, message),
  requestTimeout: (message: string) => new HttpErrorHandler(HTTP_STATUS.REQUEST_TIMEOUT, message),
  conflict: (message: string) => new HttpErrorHandler(HTTP_STATUS.CONFLICT, message),
  internalError: (message: string) => new HttpErrorHandler(HTTP_STATUS.INTERNAL_ERROR, message),
  serviceUnavailable: (message: string) =>
    new HttpErrorHandler(HTTP_STATUS.SERVICE_UNAVAILABLE, message)
};
