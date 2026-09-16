/**
 * LILLO Appwrite schema setup — idempotent.
 *
 *  Usage:  npm run setup:appwrite
 *
 *  Rules:
 *  - Never deletes/resets databases, tables, columns, or buckets.
 *  - If it exists → reuse + report "already exists".
 *  - If missing → create, then validate.
 *  - Safe to run multiple times.
 *  - Never prints the API key or secrets.
 */
import { TablesDB, Storage } from 'node-appwrite';
import { appwriteClient } from '../config/appwrite.js';
import { env } from '../config/env.js';

interface ColumnSpec {
  key: string;
  type: 'string' | 'integer';
  size?: number;
  required: boolean;
}

interface TableSpec {
  label: string;
  tableId: string;
  name: string;
  columns: ColumnSpec[];
}

const TABLES: TableSpec[] = [
  {
    label: 'categories',
    tableId: env.appwrite.tables.categories || 'categories',
    name: 'Categories',
    columns: [
      { key: 'name', type: 'string', size: 100, required: true },
      { key: 'slug', type: 'string', size: 100, required: true },
      { key: 'description', type: 'string', size: 500, required: false },
    ],
  },
  {
    label: 'products',
    tableId: env.appwrite.tables.products || 'products',
    name: 'Products',
    columns: [
      { key: 'name', type: 'string', size: 200, required: true },
      { key: 'slug', type: 'string', size: 200, required: true },
      { key: 'description', type: 'string', size: 2000, required: false },
      { key: 'price', type: 'integer', required: true },
      { key: 'category_id', type: 'string', size: 100, required: false },
      { key: 'image', type: 'string', size: 1000, required: false },
    ],
  },
  {
    label: 'inventory',
    tableId: env.appwrite.tables.inventory || 'inventory',
    name: 'Inventory',
    columns: [
      { key: 'product_id', type: 'string', size: 100, required: true },
      { key: 'stock', type: 'integer', required: false },
      { key: 'updated_at', type: 'string', size: 100, required: false },
    ],
  },
  {
    label: 'inventory_transactions',
    tableId: env.appwrite.tables.inventoryTransactions || 'inventory_transactions',
    name: 'Inventory Transactions',
    columns: [
      { key: 'product_id', type: 'string', size: 100, required: true },
      { key: 'type', type: 'string', size: 20, required: true },
      { key: 'quantity', type: 'integer', required: true },
      { key: 'description', type: 'string', size: 500, required: true },
      { key: 'stock_before', type: 'integer', required: true },
      { key: 'stock_after', type: 'integer', required: true },
      { key: 'created_at', type: 'string', size: 100, required: true },
    ],
  },
  {
    label: 'homepage_content',
    tableId: env.appwrite.tables.homepageContent || 'homepage_content',
    name: 'Homepage Content',
    columns: [
      { key: 'contentJson', type: 'string', size: 20000, required: true },
      { key: 'updatedAt', type: 'string', size: 100, required: false },
    ],
  },
  {
    label: 'about_content',
    tableId: env.appwrite.tables.aboutContent || 'about_content',
    name: 'About Content',
    columns: [
      { key: 'contentJson', type: 'string', size: 20000, required: true },
      { key: 'updatedAt', type: 'string', size: 100, required: false },
    ],
  },
  {
    // Backend-only admin session store (persistent token revocation).
    // API-key access only; stores the SHA-256 hash of the session token,
    // never the raw token or any credential.
    label: 'admin_sessions',
    tableId: env.appwrite.tables.adminSessions || 'admin_sessions',
    name: 'Admin Sessions',
    columns: [
      { key: 'token_hash', type: 'string', size: 128, required: true },
      { key: 'user_id', type: 'string', size: 100, required: true },
      { key: 'expires_at', type: 'string', size: 100, required: true },
      { key: 'created_at', type: 'string', size: 100, required: false },
      { key: 'revoked_at', type: 'string', size: 100, required: false },
    ],
  },
];

const BUCKETS: Array<{ label: string; bucketId: string; name: string }> = [
  {
    label: 'product-images',
    bucketId: process.env.APPWRITE_PRODUCT_IMAGES_BUCKET_ID || 'product-images',
    name: 'Product Images',
  },
  {
    label: 'homepage-assets',
    bucketId: process.env.APPWRITE_HOMEPAGE_ASSETS_BUCKET_ID || 'homepage-assets',
    name: 'Homepage Assets',
  },
];

let hadError = false;
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

function isNotFound(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /could not be found|not found|404/i.test(msg);
}

async function ensureTable(tablesDB: TablesDB, databaseId: string, spec: TableSpec): Promise<void> {
  try {
    await tablesDB.getTable(databaseId, spec.tableId);
    console.log(`[OK] ${spec.label} already exists`);
  } catch (err: unknown) {
    if (!isNotFound(err)) {
      hadError = true;
      console.log(`[ERROR] ${spec.label}: ${err instanceof Error ? err.message : err}`);
      return;
    }
    try {
      await tablesDB.createTable(databaseId, spec.tableId, spec.name);
      console.log(`[OK] ${spec.label} created`);
      await sleep(1500);
    } catch (createErr: unknown) {
      hadError = true;
      console.log(`[ERROR] ${spec.label} create failed: ${createErr instanceof Error ? createErr.message : createErr}`);
      return;
    }
  }

  for (const col of spec.columns) {
    try {
      await tablesDB.getColumn(databaseId, spec.tableId, col.key);
      console.log(`[OK] ${spec.label}.${col.key} already exists`);
    } catch (err: unknown) {
      if (!isNotFound(err)) {
        hadError = true;
        console.log(`[ERROR] ${spec.label}.${col.key}: ${err instanceof Error ? err.message : err}`);
        continue;
      }
      try {
        if (col.type === 'string') {
          await tablesDB.createStringColumn(databaseId, spec.tableId, col.key, col.size || 255, col.required);
        } else {
          await tablesDB.createIntegerColumn(databaseId, spec.tableId, col.key, col.required);
        }
        console.log(`[OK] ${spec.label}.${col.key} created`);
        await sleep(800);
      } catch (createErr: unknown) {
        hadError = true;
        console.log(`[ERROR] ${spec.label}.${col.key} create failed: ${createErr instanceof Error ? createErr.message : createErr}`);
      }
    }
  }
}

async function ensureBucket(storage: Storage, bucketId: string, name: string, label: string): Promise<void> {
  try {
    await storage.getBucket(bucketId);
    console.log(`[OK] ${label} bucket already exists`);
  } catch (err: unknown) {
    if (!isNotFound(err)) {
      hadError = true;
      console.log(`[ERROR] ${label} bucket: ${err instanceof Error ? err.message : err}`);
      return;
    }
    try {
      await storage.createBucket(bucketId, name, ['read("any")'], true, true, 30 * 1024 * 1024);
      console.log(`[OK] ${label} bucket created`);
    } catch (createErr: unknown) {
      hadError = true;
      console.log(`[ERROR] ${label} bucket create failed: ${createErr instanceof Error ? createErr.message : createErr}`);
    }
  }
}

async function validate(tablesDB: TablesDB, storage: Storage, databaseId: string): Promise<void> {
  console.log('--- Validation ---');
  for (const spec of TABLES) {
    try {
      const cols = await tablesDB.listColumns(databaseId, spec.tableId);
      const byKey = new Map((cols.columns || []).map((c: { key: string }) => [c.key, c as Record<string, unknown>]));
      for (const col of spec.columns) {
        const found = byKey.get(col.key);
        if (!found) {
          hadError = true;
          console.log(`[MISMATCH] ${spec.label}.${col.key} MISSING (expected ${col.type}, required=${col.required})`);
        } else {
          const typeOk = String(found['type'] || '').toLowerCase() === col.type;
          const reqOk = Boolean(found['required']) === col.required;
          if (!typeOk || !reqOk) {
            hadError = true;
            console.log(`[MISMATCH] ${spec.label}.${col.key} differs (found type=${found['type']} required=${found['required']}, expected ${col.type}/${col.required}) — left untouched`);
          } else {
            console.log(`[OK] ${spec.label}.${col.key} validated`);
          }
        }
      }
    } catch (err: unknown) {
      hadError = true;
      console.log(`[ERROR] validate ${spec.label}: ${err instanceof Error ? err.message : err}`);
    }
  }
  for (const b of BUCKETS) {
    try {
      await storage.getBucket(b.bucketId);
      console.log(`[OK] ${b.label} bucket validated`);
    } catch (err: unknown) {
      hadError = true;
      console.log(`[ERROR] ${b.label} bucket missing: ${err instanceof Error ? err.message : err}`);
    }
  }
}

async function main(): Promise<void> {
  const databaseId = env.appwrite.databaseId;
  const tablesDB = new TablesDB(appwriteClient);
  const storage = new Storage(appwriteClient);

  try {
    await tablesDB.get(databaseId);
    console.log('[OK] Database connected');
  } catch (err: unknown) {
    console.log(`[ERROR] Database "${databaseId}" not accessible: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  for (const spec of TABLES) {
    await ensureTable(tablesDB, databaseId, spec);
  }
  for (const b of BUCKETS) {
    await ensureBucket(storage, b.bucketId, b.name, b.label);
  }

  await validate(tablesDB, storage, databaseId);

  if (hadError) {
    console.log('[DONE] Completed with errors — see [ERROR]/[MISMATCH] lines above');
    process.exit(1);
  }
  console.log('[DONE] Setup validated successfully');
}

main().catch((err: unknown) => {
  console.log(`[ERROR] ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
