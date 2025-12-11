import type { AnyZodObject } from 'zod';
import { ZodError } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });

      return next(); // return opcional, mas ajuda TS
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          issues: err.errors
        });
        return;
      }

      return next(err);
    }
  };
