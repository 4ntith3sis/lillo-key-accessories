/**
 * Appwrite access diagnostic — READ ONLY.
 *
 *  Usage:  npm run test:appwrite
 *
 *  Performs no create/update/delete/seed. Never prints the API key
 *  (only availability + first/last 4 chars).
 */
import { TablesDB } from 'node-appwrite';
import { Query } from 'node-appwrite';
import { appwriteClient, appwriteDatabases } from '../config/appwrite.js';
import { env } from '../config/env.js';

function fingerprint(key: string): string {
  if (!key) return '(empty)';
  if (key.length < 8) return `len=${key.length}`;
  return `${key.slice(0, 4)}...${key.slice(-4)} (len=${key.length})`;
}

async function main(): Promise<void> {
  console.log(`API key loaded: ${env.appwrite.apiKey ? 'yes' : 'no'}`);
  console.log(`API key fingerprint: ${fingerprint(env.appwrite.apiKey)}`);
  console.log(`Project ID: ${env.appwrite.projectId || '(empty)'}`);
  console.log(`Endpoint: ${env.appwrite.endpoint}`);
  console.log(`Database ID: ${env.appwrite.databaseId}`);

  const tablesDB = new TablesDB(appwriteClient);
  const databaseId = env.appwrite.databaseId;

  try {
    await tablesDB.get(databaseId);
    console.log('Database READ result: PASS');
  } catch (err: unknown) {
    console.log(`Database READ result: FAIL: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  const tables: Array<[string, string]> = [
    ['products', env.appwrite.tables.products],
    ['categories', env.appwrite.tables.categories],
    ['inventory', env.appwrite.tables.inventory],
  ];
  for (const [label, tableId] of tables) {
    try {
      // Same call pattern the backend services use (Databases.listDocuments).
      const res = await appwriteDatabases.listDocuments(databaseId, tableId, [Query.limit(1)]);
      console.log(`Table READ (${label} -> "${tableId}"): PASS (total=${res.total})`);
    } catch (err: unknown) {
      console.log(`Table READ (${label} -> "${tableId}"): FAIL: ${err instanceof Error ? err.message : err}`);
    }
  }
}

main().catch((err: unknown) => {
  console.log(`Diagnostic error: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
