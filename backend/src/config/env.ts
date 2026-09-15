import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 4000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
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
