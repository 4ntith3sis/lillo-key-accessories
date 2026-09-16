import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { Client, Account, Users, Query, Models } from 'node-appwrite';
import { appwriteClient, isAppwriteConfigured } from '../config/appwrite.js';
import { appwriteDatabaseService } from '../services/appwrite/database.js';
import { env } from '../config/env.js';

// Appwrite cloud no longer returns a usable `secret` for server-side created
// email sessions (the field comes back empty), so the cookie session secret
// is issued by this backend: an HMAC token signed with the dedicated,
// backend-only SESSION_SECRET env var (never APPWRITE_API_KEY). Identity and
// the admin role still come from Appwrite (email/password + user labels).
//
// Revocation is PERSISTENT: each issued token is recorded in the Appwrite
// database collection `admin_sessions` (token hash only, never the raw
// token). logout marks the record revoked, so revocation survives Vercel
// serverless instance recycling / cold starts.
const ADMIN_TOKEN_PREFIX = 'ltv1.';
const ADMIN_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // match cookie maxAge

const adminSessionsCollection = () => env.appwrite.tables.adminSessions;

const tokenHash = (token: string): string => createHash('sha256').update(token).digest('hex');

const signTokenPayload = (payload: string): string =>
  createHmac('sha256', env.sessionSecret).update(payload).digest('base64url');

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
}

// In-memory revocation cache (fast path only — the Appwrite store is
// authoritative and survives serverless recycling).
const invalidatedTokens = new Set<string>();

interface AdminSessionRecord extends Models.Document {
  token_hash?: string;
  user_id?: string;
  expires_at?: string;
  created_at?: string;
  revoked_at?: string;
}

export class AuthService {
  private createSessionClient(sessionSecret?: string): Client {
    const client = new Client();
    if (env.appwrite.endpoint) client.setEndpoint(env.appwrite.endpoint);
    if (env.appwrite.projectId) client.setProject(env.appwrite.projectId);
    if (sessionSecret) client.setSession(sessionSecret);
    return client;
  }

  private issueAdminToken(userId: string): string {
    if (!env.sessionSecret) {
      throw new Error('SESSION_SECRET_NOT_CONFIGURED');
    }
    const payload = Buffer.from(
      JSON.stringify({ uid: userId, iat: Date.now(), exp: Date.now() + ADMIN_TOKEN_TTL_MS }),
    ).toString('base64url');
    return `${ADMIN_TOKEN_PREFIX}${payload}.${signTokenPayload(payload)}`;
  }

  private verifyAdminToken(token: string): string | null {
    if (!env.sessionSecret) return null;
    const body = token.slice(ADMIN_TOKEN_PREFIX.length);
    const [payload, signature] = body.split('.');
    if (!payload || !signature) return null;
    const expected = signTokenPayload(payload);
    const a = Buffer.from(signature, 'base64url');
    const b = Buffer.from(expected, 'base64url');
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    try {
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
      if (typeof data?.uid !== 'string' || Date.now() > data.exp) return null;
      return data.uid;
    } catch {
      return null;
    }
  }

  private findSessionRecord(hash: string): Promise<AdminSessionRecord | null> {
    return appwriteDatabaseService
      .listDocuments<AdminSessionRecord>(adminSessionsCollection(), [
        Query.equal('token_hash', hash),
        Query.limit(1),
      ])
      .then((docs) => docs[0] ?? null)
      .catch(() => null);
  }

  async loginAdmin(email: string, password: string): Promise<{ sessionSecret: string; user: AdminUser }> {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Appwrite Authentication
    if (isAppwriteConfigured()) {
      try {
        const client = this.createSessionClient();
        const account = new Account(client);
        
        // 1. Create Email Password Session in Appwrite
        const session = await account.createEmailPasswordSession({ email, password });
        
        // 2. Fetch User Details to verify Admin role/label using Server API key
        const users = new Users(appwriteClient);
        const user = await users.get({ userId: session.userId });
        
        const hasAdminLabel = Array.isArray(user.labels) && user.labels.includes('admin');
        const isDevAdminEmail = env.adminEmail && user.email.toLowerCase() === env.adminEmail.toLowerCase();
        const isAdmin = hasAdminLabel || Boolean(isDevAdminEmail);

        if (!isAdmin) {
          // Delete the verification session (server API key) before denying access
          await users.deleteSession({ userId: user.$id, sessionId: session.$id }).catch(() => {});
          throw new Error('ADMIN_ACCESS_REQUIRED');
        }

        // 3. Issue the backend session token (HMAC, signed with SESSION_SECRET).
        const adminToken = this.issueAdminToken(user.$id);
        invalidatedTokens.delete(adminToken);

        // 4. Persist the session record (authoritative for revocation across
        //    serverless instances). Without a store the token would verify
        //    nowhere, so fail the login rather than issue an unusable one.
        const expiresAt = new Date(Date.now() + ADMIN_TOKEN_TTL_MS).toISOString();
        try {
          await appwriteDatabaseService.createDocument<AdminSessionRecord>(
            adminSessionsCollection(),
            {
              token_hash: tokenHash(adminToken),
              user_id: user.$id,
              expires_at: expiresAt,
              created_at: new Date().toISOString(),
            }
          );
        } catch (storeErr: any) {
          console.error('[Auth] Failed to persist admin session record:', storeErr?.message || storeErr);
          throw new Error('ADMIN_SESSION_STORE_UNAVAILABLE');
        }

        // The email session above was only for credential verification; clean it up.
        users.deleteSession({ userId: user.$id, sessionId: session.$id }).catch(() => {});

        return {
          sessionSecret: adminToken,
          user: {
            id: user.$id,
            email: user.email,
            name: user.name || 'Admin',
            isAdmin: true,
          },
        };
      } catch (err: any) {
        if (
          err?.message === 'ADMIN_ACCESS_REQUIRED' ||
          err?.message === 'ADMIN_SESSION_STORE_UNAVAILABLE' ||
          err?.message === 'SESSION_SECRET_NOT_CONFIGURED'
        ) {
          throw err;
        }
        console.warn('Appwrite login failed, attempting dev fallback:', err?.message || err);
      }
    }

    // Dev Fallback Admin Mode for offline / initial setup testing.
    // NEVER active in production — there, authentication must come from Appwrite.
    if (env.nodeEnv === 'production') {
      throw new Error('INVALID_CREDENTIALS');
    }

    const fallbackEmail = env.adminEmail.toLowerCase();
    const fallbackPass = env.adminPassword;

    if (email.toLowerCase().trim() === fallbackEmail && password === fallbackPass) {
      const devToken = `dev_admin_session_${Date.now()}`;
      invalidatedTokens.delete(devToken);
      return {
        sessionSecret: devToken,
        user: {
          id: 'admin_dev_001',
          email: fallbackEmail,
          name: 'LILLO Admin',
          isAdmin: true,
        },
      };
    }

    throw new Error('INVALID_CREDENTIALS');
  }

  async verifySession(sessionSecret: string): Promise<AdminUser | null> {
    if (!sessionSecret || invalidatedTokens.has(sessionSecret)) return null;

    if (sessionSecret.startsWith('dev_admin_session_')) {
      if (env.nodeEnv === 'production') return null;
      return {
        id: 'admin_dev_001',
        email: env.adminEmail || 'dev-admin',
        name: 'LILLO Admin',
        isAdmin: true,
      };
    }

    // Backend-issued HMAC admin token (ltv1.*) — the cookie value since
    // Appwrite stopped returning session secrets for server-side sessions.
    // Verification = HMAC signature + PERSISTENT session record
    // (exists, not revoked, not expired) + live admin role check.
    if (sessionSecret.startsWith(ADMIN_TOKEN_PREFIX)) {
      const uid = this.verifyAdminToken(sessionSecret);
      if (!uid || !isAppwriteConfigured()) return null;
      const record = await this.findSessionRecord(tokenHash(sessionSecret));
      if (!record || record.revoked_at || !record.expires_at || new Date(record.expires_at).getTime() < Date.now()) {
        return null;
      }
      try {
        const users = new Users(appwriteClient);
        const u = await users.get({ userId: uid });
        const isAdmin =
          (Array.isArray(u.labels) && u.labels.includes('admin')) ||
          Boolean(env.adminEmail && u.email.toLowerCase() === env.adminEmail.toLowerCase());
        if (!isAdmin) return null;
        return {
          id: u.$id,
          email: u.email,
          name: u.name || 'Admin',
          isAdmin: true,
        };
      } catch {
        return null;
      }
    }

    if (!isAppwriteConfigured()) return null;

    try {
      const client = this.createSessionClient(sessionSecret);
      const account = new Account(client);
      const user = await account.get();

      // Check admin status via server SDK Users service
      const users = new Users(appwriteClient);
      const userDetails = await users.get({ userId: user.$id }).catch(() => null);

      const hasAdminLabel = userDetails && Array.isArray(userDetails.labels) && userDetails.labels.includes('admin');
      const isDevAdminEmail = env.adminEmail && user.email.toLowerCase() === env.adminEmail.toLowerCase();
      const isAdmin = hasAdminLabel || Boolean(isDevAdminEmail);

      return {
        id: user.$id,
        email: user.email,
        name: user.name || 'Admin',
        isAdmin: Boolean(isAdmin),
      };
    } catch (err: any) {
      return null;
    }
  }

  async logoutAdmin(sessionSecret: string): Promise<boolean> {
    if (!sessionSecret) return true;

    invalidatedTokens.add(sessionSecret);

    const isBackendToken = sessionSecret.startsWith(ADMIN_TOKEN_PREFIX);
    if (isBackendToken) {
      // Persistent revocation: mark the session record revoked in Appwrite so
      // the token stays dead across serverless instance recycling.
      const record = await this.findSessionRecord(tokenHash(sessionSecret));
      if (record && !record.revoked_at) {
        await appwriteDatabaseService
          .updateDocument<AdminSessionRecord>(adminSessionsCollection(), record.$id, {
            revoked_at: new Date().toISOString(),
          })
          .catch((err: any) => {
            console.warn('[Auth] Failed to persist session revocation:', err?.message || err);
          });
      }
      return true;
    }

    const isDevToken = sessionSecret.startsWith('dev_admin_session_');
    if (isAppwriteConfigured() && !isDevToken) {
      try {
        const client = this.createSessionClient(sessionSecret);
        const account = new Account(client);
        await account.deleteSession({ sessionId: 'current' });
      } catch (err: any) {
        console.warn('Appwrite deleteSession error on logout:', err?.message || err);
      }
    }

    return true;
  }
}

export const authService = new AuthService();
export default authService;
