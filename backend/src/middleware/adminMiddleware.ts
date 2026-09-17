import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware.js';

export const adminMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
    return;
  }
  next();
};

export default adminMiddleware;
