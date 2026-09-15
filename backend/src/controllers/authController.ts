import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { env } from '../config/env.js';

// In-memory rate limiting for login attempts
interface RateLimitRecord {
  attempts: number;
  resetAt: number;
}
const loginRateLimits = new Map<string, RateLimitRecord>();

const checkLoginRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const record = loginRateLimits.get(ip);
  if (!record) return true;

  if (now > record.resetAt) {
    loginRateLimits.delete(ip);
    return true;
  }

  return record.attempts < 5;
};

const recordFailedLogin = (ip: string): void => {
  const now = Date.now();
  const record = loginRateLimits.get(ip);
  const windowMs = 15 * 60 * 1000; // 15 minutes window

  if (!record || now > record.resetAt) {
    loginRateLimits.set(ip, { attempts: 1, resetAt: now + windowMs });
  } else {
    record.attempts += 1;
  }
};

const clearLoginRateLimit = (ip: string): void => {
  loginRateLimits.delete(ip);
};

/**
 * Session cookie options shared by login (set) and logout (clear).
 * Local dev keeps `lax` over HTTP; cross-site production (Vercel frontend →
 * separate backend host) requires `sameSite: 'none'` + `secure: true`.
 * Override explicitly with COOKIE_SAMESITE / COOKIE_SECURE when needed.
 */
const isProduction = (): boolean => env.nodeEnv === 'production';

const sessionCookieOptions = (): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'none';
  maxAge: number;
  path: string;
} => {
  const sameSiteOpt = env.cookieSameSite.toLowerCase();
  const sameSite: 'lax' | 'none' =
    sameSiteOpt === 'none'
      ? 'none'
      : 'lax'; // Default lax for same-origin single Vercel deployment
  const secureOpt = env.cookieSecure.toLowerCase();
  const secure =
    secureOpt === 'true' || (secureOpt !== 'false' && isProduction());
  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
};


export const loginHandler = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (!checkLoginRateLimit(ip)) {
      res.status(429).json({
        success: false,
        message: 'Too many failed login attempts. Please try again in 15 minutes.',
      });
      return;
    }

    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim() || !password || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    try {
      const { sessionSecret, user } = await authService.loginAdmin(email.trim(), password);

      clearLoginRateLimit(ip);

      // Set secure HttpOnly session cookie
      res.cookie('lillo_session', sessionSecret, sessionCookieOptions());

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (err: any) {
      recordFailedLogin(ip);

      if (err?.message === 'ADMIN_ACCESS_REQUIRED') {
        res.status(403).json({
          success: false,
          message: 'Admin access required',
        });
        return;
      }

      // Return sanitized, user-friendly error without exposing internal stack traces
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
    });
  }
};

export const logoutHandler = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const sessionToken = req.cookies?.lillo_session || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : '');

    if (sessionToken) {
      await authService.logoutAdmin(sessionToken).catch(() => {});
    }

    res.clearCookie('lillo_session', sessionCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.clearCookie('lillo_session', sessionCookieOptions());
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
};

export const getMeHandler = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const sessionToken = req.cookies?.lillo_session || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : '');

    if (!sessionToken) {
      res.status(200).json({
        success: true,
        authenticated: false,
      });
      return;
    }

    const user = await authService.verifySession(sessionToken);

    if (!user || !user.isAdmin) {
      res.status(200).json({
        success: true,
        authenticated: false,
      });
      return;
    }

    res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      authenticated: false,
    });
  }
};

export default {
  loginHandler,
  logoutHandler,
  getMeHandler,
};
