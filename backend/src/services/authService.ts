import { Client, Account, Users } from 'node-appwrite';
import { appwriteClient, isAppwriteConfigured } from '../config/appwrite.js';
import { env } from '../config/env.js';


export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
}

// In-memory set of revoked/invalidated session tokens
const invalidatedTokens = new Set<string>();

export class AuthService {
  private createSessionClient(sessionSecret?: string): Client {
    const client = new Client();
    if (env.appwrite.endpoint) client.setEndpoint(env.appwrite.endpoint);
    if (env.appwrite.projectId) client.setProject(env.appwrite.projectId);
    if (sessionSecret) client.setSession(sessionSecret);
    return client;
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
          // Delete created session if non-admin user attempts admin login
          const sessionClient = this.createSessionClient(session.secret);
          const sessionAccount = new Account(sessionClient);
          await sessionAccount.deleteSession({ sessionId: 'current' }).catch(() => {});
          throw new Error('ADMIN_ACCESS_REQUIRED');
        }

        invalidatedTokens.delete(session.secret);

        return {
          sessionSecret: session.secret,
          user: {
            id: user.$id,
            email: user.email,
            name: user.name || 'Admin',
            isAdmin: true,
          },
        };
      } catch (err: any) {
        if (err?.message === 'ADMIN_ACCESS_REQUIRED') {
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

    if (isAppwriteConfigured() && !sessionSecret.startsWith('dev_admin_session_')) {
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
