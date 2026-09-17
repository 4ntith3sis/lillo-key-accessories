import { appwriteDatabaseService } from '../services/appwrite/database.js';
import { env } from '../config/env.js';

async function check() {
  try {
    const invDocs = await appwriteDatabaseService.listDocuments(env.appwrite.tables.inventory, []);
    console.log('--- INVENTORY DOCUMENTS ---');
    console.log(JSON.stringify(invDocs, null, 2));

    const prodDocs = await appwriteDatabaseService.listDocuments(env.appwrite.tables.products, []);
    console.log('--- SAMPLE PRODUCTS ---');
    console.log(prodDocs.slice(0, 5).map((p: Record<string, any>) => ({ id: p.$id, name: p.name })));
  } catch (err) {
    console.error('Error checking Appwrite:', err);
  }
}

check();
