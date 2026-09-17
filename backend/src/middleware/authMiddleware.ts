import { Request, Response, NextFunction } from 'express';
import { authService, AdminUser } from '../services/authService.js';

export interface AuthenticatedRequest extends Request {
  user?: AdminUser;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let sessionToken: string | undefined = req.cookies?.lillo_session;

    if (!sessionToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7).trim();
      }
    }

    if (!sessionToken) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const user = await authService.verifySession(sessionToken);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }
};

export default authMiddleware;
