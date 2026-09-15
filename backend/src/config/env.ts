import dotenv from 'dotenv';

dotenv.config();

// ============================================================
// ENVIRONMENT VARIABLE VALIDATION
// Warn clearly if critical variables are missing at startup.
// ============================================================
const REQUIRED_IN_PRODUCTION = [
  'APPWRITE_PROJECT_ID',
  'APPWRITE_API_KEY',
  'APPWRITE_DATABASE_ID',
  'FRONTEND_URL',
];

if (process.env.NODE_ENV === 'production') {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error('\n[LILLO Backend] ❌ Missing required environment variables in production:');
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error('\nSet these in Vercel Dashboard → Project Settings → Environment Variables\n');
    process.exit(1);
  }
}

// ============================================================
// CENTRALIZED ENVIRONMENT CONFIG
// All process.env access in the backend must go through here.
// ============================================================
export const env = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Admin (dev fallback only — must use Appwrite labels in production)
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',

  // Cookie overrides (optional — defaults are safe for most deployments)
  cookieSameSite: process.env.COOKIE_SAMESITE || '',
  cookieSecure: process.env.COOKIE_SECURE || '',

  // Appwrite
  appwrite: {
    endpoint: process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: process.env.APPWRITE_PROJECT_ID || '',
    apiKey: process.env.APPWRITE_API_KEY || '',
    databaseId: process.env.APPWRITE_DATABASE_ID || 'lillo_main_db',
    tables: {
      products: process.env.APPWRITE_PRODUCTS_TABLE_ID || 'products',
      categories: process.env.APPWRITE_CATEGORIES_TABLE_ID || 'categories',
      inventory: process.env.APPWRITE_INVENTORY_TABLE_ID || 'inventory',
      inventoryTransactions: process.env.APPWRITE_INVENTORY_TRANSACTIONS_TABLE_ID || 'inventory_transactions',
      homepageContent: process.env.APPWRITE_HOMEPAGE_CONTENT_TABLE_ID || 'homepage_content',
      aboutContent: process.env.APPWRITE_ABOUT_CONTENT_TABLE_ID || 'about_content',
    },
    buckets: {
      productImages: process.env.APPWRITE_PRODUCT_IMAGES_BUCKET_ID || 'product-images',
      homepageAssets: process.env.APPWRITE_HOMEPAGE_ASSETS_BUCKET_ID || process.env.APPWRITE_PRODUCT_IMAGES_BUCKET_ID || 'product-images',
    },
  },
};

export default env;
