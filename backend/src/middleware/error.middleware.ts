import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendResponse } from '../utils/response.util';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 Central Error Handler:', err);

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendResponse(res, 400, false, 'Validation Error', undefined, undefined, formattedErrors);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return sendResponse(res, statusCode, false, message);
};
