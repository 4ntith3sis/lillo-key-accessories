// Single source of truth for the LILLO API base URL.
//
// TARGET ARCHITECTURE:
//   Local dev (browser + SSR):  http://localhost:3000  ->  https://lillo-key-accessories.vercel.app/api
//   Production (browser + SSR): https://lillo-key-accessories.vercel.app ->  same-origin /api
//
// The frontend must NEVER depend on a local Express backend. All API calls
// go through the Vercel-hosted Express serverless function.

// One place where the production API origin lives. Other files must not
// duplicate this URL — import DEFAULT_API_ORIGIN or API_BASE_URL from here.
export const DEFAULT_API_ORIGIN = 'https://lillo-key-accessories.vercel.app';

const isLocalHostname = (hostname: string): boolean =>
  hostname === 'localhost' || hostname === '127.0.0.1';

export const getApiBaseUrl = (): string => {
  let url = '';

  if (typeof window !== 'undefined') {
    // BROWSER RUNTIME (client-side)
    if (process.env.NEXT_PUBLIC_API_URL) {
      // Explicit configuration wins (e.g. NEXT_PUBLIC_API_URL=/api in production,
      // or a full https origin for local development).
      url = process.env.NEXT_PUBLIC_API_URL;
    } else if (!isLocalHostname(window.location.hostname)) {
      // Production / Vercel preview: frontend and /api/* are on the same origin.
      url = '';
    } else {
      // Local frontend without NEXT_PUBLIC_API_URL: target the production Vercel
      // API so the frontend works without a local backend.
      url = DEFAULT_API_ORIGIN;
    }
  } else {
    // NODE RUNTIME (SSR / serverless function)
    if (process.env.VERCEL_URL) {
      url = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('http')) {
      url = process.env.FRONTEND_URL;
    } else if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith('http')) {
      url = process.env.NEXT_PUBLIC_API_URL;
    } else {
      // Local `next dev` SSR (or a Vercel function missing VERCEL_URL):
      // use the production Vercel API — never a dead localhost backend.
      url = DEFAULT_API_ORIGIN;
    }
  }

  // Strip trailing '/api' or '/' so fetch(`${API_BASE_URL}/api/...`) can never
  // produce '/api/api/...' or 'https://host//api/...'.
  return url.replace(/\/api\/?$/, '').replace(/\/+$/, '');
};

export const API_BASE_URL = getApiBaseUrl();
