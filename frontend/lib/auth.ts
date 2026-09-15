const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return '';
    }
  } else {
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
  }
  return 'http://localhost:4000';
};

const API_BASE_URL = getApiBaseUrl();



export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: User;
}

export async function login(email: string, password: string): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.success || !json.user) {
    throw new Error(json.message || 'Email atau password salah.');
  }

  return { user: json.user };
}

export async function logout(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    const json = await res.json().catch(() => ({}));
    return Boolean(json.success);
  } catch {
    return false;
  }
}

export async function getCurrentUser(): Promise<AuthStatus> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) return { authenticated: false };

    const json = await res.json().catch(() => ({}));
    if (json.success && json.authenticated && json.user) {
      return {
        authenticated: true,
        user: json.user,
      };
    }

    return { authenticated: false };
  } catch {
    return { authenticated: false };
  }
}
