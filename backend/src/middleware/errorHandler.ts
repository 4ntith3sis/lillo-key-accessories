import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode || 500;
  const message = err?.message || 'Internal server error';

  console.error(`[Error] ${req.method} ${req.url}:`, message);

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : message,
  });
};

export default errorHandler;
