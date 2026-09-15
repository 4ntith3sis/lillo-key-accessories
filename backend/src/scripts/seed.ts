/**
 * LILLO database seed — Phase 4A + 4B.
 *
 *  Usage:  npm run seed
 *
 *  Safety rules:
 *  - UPSERT only (check-before-create). Never delete/drop/truncate.
 *  - Safe to run multiple times — second run must report 0 created.
 *  - VALIDATION FIRST: if any source record is invalid or a required
 *    source section is empty, the script STOPS before writing anything.
 *  - Never prints API key or secrets.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Client, Databases, Storage, Query } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { env } from '../config/env.js';
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_INVENTORY } from './seedData.js';

type Counters = { created: number; updated: number; skipped: number; failed: number };
const newCounters = (): Counters => ({ created: 0, updated: 0, skipped: 0, failed: 0 });

// Frontend public assets dir (product images live here, never modified).
const ASSETS_DIR = '/Users/4ntith3sis/Documents/My project/Keychain-project/lillo-key-accessories/frontend/public/assets';

function fail(reason: string): never {
  console.log('[Seed] Failed');
  console.log(`Reason: ${reason}`);
  process.exit(1);
}

/** 1. Validate everything BEFORE touching Appwrite. */
function validateSource(): string[] {
  const errors: string[] = [];

  if (SEED_CATEGORIES.length === 0) errors.push('No categories in source data.');
  const catSlugs = new Set(SEED_CATEGORIES.map((c) => c.slug));
  for (const c of SEED_CATEGORIES) {
    if (!c.id || !c.name || !c.slug) errors.push(`Invalid category record: ${JSON.stringify(c)}`);
  }

  for (const p of SEED_PRODUCTS) {
    if (!p.id || !p.name || !p.slug) errors.push(`Product missing id/name/slug: ${p.id || '(unknown)'}`);
    if (typeof p.price !== 'number' || Number.isNaN(p.price) || p.price < 0) {
      errors.push(`Product "${p.slug}" has invalid price.`);
    }
    if (!catSlugs.has(p.categorySlug)) {
      errors.push(`Product "${p.slug}" references unknown category "${p.categorySlug}".`);
    }
    for (const f of p.imageFiles || []) {
      if (!fs.existsSync(path.join(ASSETS_DIR, f))) {
        errors.push(`Product "${p.slug}" image not found: ${f}`);
      }
    }
  }

  return errors;
}

async function upsert(
  db: Databases,
  databaseId: string,
  tableId: string,
  docId: string,
  data: Record<string, string | number | boolean | string[]>,
  counters: Counters,
  label: string
): Promise<string | null> {
  try {
    const existing = await db.getDocument(databaseId, tableId, docId);
    const patch: Record<string, string | number | boolean | string[]> = {};
    for (const [k, v] of Object.entries(data)) {
      if (JSON.stringify((existing as unknown as Record<string, unknown>)[k]) !== JSON.stringify(v)) {
        patch[k] = v;
      }
    }
    if (Object.keys(patch).length === 0) {
      counters.skipped += 1;
      return docId;
    }
    await db.updateDocument(databaseId, tableId, docId, patch);
    counters.updated += 1;
    return docId;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('could not be found') && msg.toLowerCase().includes('document')) {
      try {
        await db.createDocument(databaseId, tableId, docId, data);
        counters.created += 1;
        return docId;
      } catch (createErr: unknown) {
        console.log(`[Seed] ${label} "${docId}" create failed: ${createErr instanceof Error ? createErr.message : createErr}`);
        counters.failed += 1;
        return null;
      }
    }
    console.log(`[Seed] ${label} "${docId}" failed: ${msg}`);
    counters.failed += 1;
    return null;
  }
}

function printCounters(label: string, c: Counters): void {
  console.log(`[Seed] ${label}: created=${c.created} updated=${c.updated} skipped=${c.skipped} failed=${c.failed}`);
}

async function main(): Promise<void> {
  console.log('[Appwrite] Connecting...');
  const client = new Client()
    .setEndpoint(env.appwrite.endpoint)
    .setProject(env.appwrite.projectId)
    .setKey(env.appwrite.apiKey);
  const db = new Databases(client);
  const storage = new Storage(client);
  const databaseId = env.appwrite.databaseId;

  // 0. Connection + database must exist (never auto-create).
  try {
    await db.get(databaseId);
  } catch (err: unknown) {
    fail(`Database "${databaseId}" not accessible: ${err instanceof Error ? err.message : err}`);
  }
  console.log('[Appwrite] Connection successful');

  // 0b. Required tables + buckets must exist (never auto-create).
  const requiredTables: Array<[string, string]> = [
    ['categories', env.appwrite.tables.categories],
    ['products', env.appwrite.tables.products],
    ['inventory', env.appwrite.tables.inventory],
  ];
  for (const [label, tableId] of requiredTables) {
    try {
      await db.listDocuments(databaseId, tableId, [Query.limit(1)]);
    } catch (err: unknown) {
      fail(`Table "${label}" (${tableId}) not accessible: ${err instanceof Error ? err.message : err}`);
    }
  }
  for (const [label, bucketId] of [
    ['product_images', env.appwrite.buckets.productImages],
  ] as Array<[string, string]>) {
    try {
      await storage.getBucket(bucketId);
    } catch (err: unknown) {
      fail(`Bucket "${label}" (${bucketId}) not accessible: ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log('[Appwrite] Database, tables, and buckets verified');

  // 1. Validate source data BEFORE any write.
  const errors = validateSource();
  if (errors.length > 0) {
    console.log('[Seed] Source validation failed — STOPPING before any write:');
    for (const e of errors) console.log(`  - ${e}`);
    process.exit(1);
  }

  // 2. Categories
  const catCount = newCounters();
  const catIdBySlug = new Map<string, string>();
  for (const c of SEED_CATEGORIES) {
    const id = await upsert(db, databaseId, env.appwrite.tables.categories, c.id,
      { name: c.name, slug: c.slug, description: c.description }, catCount, 'Category');
    if (id) catIdBySlug.set(c.slug, id);
  }
  printCounters('Categories', catCount);

  // 3. Products (+ image upload)
  const prodCount = newCounters();
  let uploaded = 0;
  const prodIdBySlug = new Map<string, string>();
  for (const p of SEED_PRODUCTS) {
    const imageUrls: string[] = [];
    for (const file of p.imageFiles) {
      const fileId = `prod-${p.slug}-${path.parse(file).name}`.toLowerCase().replace(/[^a-z0-9-_]/g, '-').slice(0, 36);
      try {
        await storage.getFile(env.appwrite.buckets.productImages, fileId);
      } catch {
        const buffer = fs.readFileSync(path.join(ASSETS_DIR, file));
        await storage.createFile(
          env.appwrite.buckets.productImages,
          fileId,
          InputFile.fromBuffer(buffer, file)
        );
        uploaded += 1;
      }
      imageUrls.push(
        `${env.appwrite.endpoint}/storage/buckets/${env.appwrite.buckets.productImages}/files/${fileId}/view?project=${env.appwrite.projectId}`
      );
    }
    const categoryId = catIdBySlug.get(p.categorySlug) || '';
    const id = await upsert(db, databaseId, env.appwrite.tables.products, p.id,
      { name: p.name, slug: p.slug, description: p.description, price: p.price, category_id: categoryId, image: imageUrls[0] || '' },
      prodCount, 'Product');
    if (id) prodIdBySlug.set(p.slug, id);
  }
  printCounters('Products', prodCount);
  console.log(`[Storage] Product images uploaded: ${uploaded}`);

  // 4. Inventory
  const invCount = newCounters();
  for (const inv of SEED_INVENTORY) {
    const productId = prodIdBySlug.get(inv.productSlug) || inv.productSlug;
    const docId = `inv_${productId}`;
    const data = {
      product_id: productId,
      stock: inv.stock,
      updated_at: new Date().toISOString(),
    };
    await upsert(db, databaseId, env.appwrite.tables.inventory, docId, data, invCount, 'Inventory');
  }
  printCounters('Inventory', invCount);

  console.log('[Seed] Completed successfully');
}

main().catch((err: unknown) => {
  console.log(`[Seed] Failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
