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
 * Cookie options shared by login (set) and logout (clear).
 *
 * SameSite is derived per request:
 *  - COOKIE_SAMESITE env var wins when explicitly set ('lax' | 'none').
 *  - Cross-site callers (e.g. local frontend http://localhost:3000 hitting
 *    the production Vercel API) get `SameSite=None` so the browser can
 *    attach the cookie to credentialed cross-origin requests.
 *  - Same-origin callers keep the default `SameSite=Lax`.
 *
 * Secure is on in production, on HTTPS requests (x-forwarded-proto), or when
 * COOKIE_SECURE=true. SameSite=None is only emitted when Secure is also on,
 * which is always the case for the production Vercel API (HTTPS).
 * COOKIE_SECURE=true can force it locally as well.
 */
const isProduction = (): boolean => env.nodeEnv === 'production';

const requestIsCrossSite = (req: Request): boolean => {
  const origin =
    (typeof req.headers.origin === 'string' && req.headers.origin) ||
    (typeof req.headers.referer === 'string' && req.headers.referer) ||
    '';
  if (!origin) return false;
  let originHost = '';
  try {
    originHost = new URL(origin).hostname;
  } catch {
    return false;
  }
  const apiHost = (req.headers.host ?? '').split(':')[0];
  if (!originHost || !apiHost) return false;
  return originHost !== apiHost;
};

const requestIsSecure = (req: Request): boolean =>
  req.headers['x-forwarded-proto'] === 'https' ||
  Boolean((req.socket as { encrypted?: boolean } | undefined)?.encrypted);

const sessionCookieOptions = (req?: Request): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'none';
  maxAge: number;
  path: string;
} => {
  const sameSiteOpt = (env.cookieSameSite || '').toLowerCase();
  let sameSite: 'lax' | 'none';
  if (sameSiteOpt === 'none' || sameSiteOpt === 'lax') {
    sameSite = sameSiteOpt; // explicit env override
  } else if (req && requestIsCrossSite(req)) {
    sameSite = 'none'; // cross-site caller (local frontend -> production API)
  } else {
    sameSite = 'lax'; // default: same-origin single Vercel deployment
  }

  const secureOpt = (env.cookieSecure || '').toLowerCase();
  const secure =
    secureOpt === 'true' ||
    (secureOpt !== 'false' && (isProduction() || (req ? requestIsSecure(req) : false)));

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
    // Vercel sets X-Forwarded-For to the real client IP; keying on
    // socket.remoteAddress alone would rate-limit by internal IP (all
    // clients one bucket) in serverless.
    const xff = req.headers['x-forwarded-for'];
    const ip =
      (typeof xff === 'string' ? xff.split(',')[0]?.trim() : undefined) ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';

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

      // Set secure HttpOnly session cookie (SameSite derived per request)
      res.cookie('lillo_session', sessionSecret, sessionCookieOptions(req));

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
      // Server-side misconfiguration (missing SESSION_SECRET / session store):
      // fail closed with 503 — never issue or accept tokens with a degraded
      // secret, and never expose the underlying detail.
      if (err?.message === 'SESSION_SECRET_NOT_CONFIGURED' || err?.message === 'ADMIN_SESSION_STORE_UNAVAILABLE') {
        res.status(503).json({
          success: false,
          message: 'Authentication service is not fully configured. Contact the administrator.',
        });
        return;
      }

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

    res.clearCookie('lillo_session', sessionCookieOptions(req));

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.clearCookie('lillo_session', sessionCookieOptions(req));
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
