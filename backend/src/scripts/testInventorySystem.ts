import { inventoryService } from '../services/inventoryService.js';
import { appwriteDatabaseService } from '../services/appwrite/database.js';
import { env } from '../config/env.js';

async function runTests() {
  console.log('=== STARTING LILLO INVENTORY SYSTEM TEST SUITE ===\n');

  // 1. Get a test product from Appwrite
  const prodDocs = await appwriteDatabaseService.listDocuments(env.appwrite.tables.products, []);
  if (prodDocs.length === 0) {
    console.error('FAIL: No products found in Appwrite for testing');
    process.exit(1);
  }

  const testProduct = prodDocs[0] as Record<string, any>;
  const productId = testProduct.$id;
  console.log(`Using Test Product: "${testProduct.name}" (ID: ${productId})`);

  // Reset initial stock to 0 for test product
  await inventoryService.updateInventory(productId, 0);
  console.log('Initial stock reset to 0.');

  // TEST 1: Stock In 25
  console.log('\n--- TEST 1: Stock In 25 ---');
  const res1 = await inventoryService.recordStockMovement({
    productId,
    type: 'STOCK_IN',
    quantity: 25,
    description: 'Initial Restock Test 1',
  });
  console.log(`Resulting Stock: ${res1.inventory.stock} (Expected: 25)`);
  if (res1.inventory.stock !== 25) throw new Error('TEST 1 FAILED');

  // TEST 2: Stock In 10
  console.log('\n--- TEST 2: Stock In 10 ---');
  const res2 = await inventoryService.recordStockMovement({
    productId,
    type: 'STOCK_IN',
    quantity: 10,
    description: 'Restock Supplier Test 2',
  });
  console.log(`Resulting Stock: ${res2.inventory.stock} (Expected: 35)`);
  if (res2.inventory.stock !== 35) throw new Error('TEST 2 FAILED');

  // TEST 3: Stock Out 5
  console.log('\n--- TEST 3: Stock Out 5 ---');
  const res3 = await inventoryService.recordStockMovement({
    productId,
    type: 'STOCK_OUT',
    quantity: 5,
    description: 'Barang rusak Test 3',
  });
  console.log(`Resulting Stock: ${res3.inventory.stock} (Expected: 30)`);
  if (res3.inventory.stock !== 30) throw new Error('TEST 3 FAILED');

  // TEST 4: Insufficient Stock Out 50 (when stock is 30)
  console.log('\n--- TEST 4: Stock Out 50 (Current Stock = 30) ---');
  try {
    await inventoryService.recordStockMovement({
      productId,
      type: 'STOCK_OUT',
      quantity: 50,
      description: 'Penjualan berlebih Test 4',
    });
    console.error('FAIL: Expected Stock Out 50 to be rejected');
    throw new Error('TEST 4 FAILED');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`REJECTED as expected: "${msg}"`);
    if (!msg.includes('Stock tidak mencukupi')) throw new Error('TEST 4 FAILED: Wrong error message');
  }

  // Verify stock is still 30
  const checkStock4 = await inventoryService.getInventoryByProductId(productId);
  if (checkStock4?.stock !== 30) throw new Error(`TEST 4 FAILED: Stock changed to ${checkStock4?.stock}`);
  console.log('Stock remains 30 as expected.');

  // TEST 5: Empty Description
  console.log('\n--- TEST 5: Empty Description ---');
  try {
    await inventoryService.recordStockMovement({
      productId,
      type: 'STOCK_IN',
      quantity: 10,
      description: '   ',
    });
    throw new Error('TEST 5 FAILED: Empty description accepted');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`REJECTED as expected: "${msg}"`);
  }

  // TEST 6: Quantity 0
  console.log('\n--- TEST 6: Quantity 0 ---');
  try {
    await inventoryService.recordStockMovement({
      productId,
      type: 'STOCK_IN',
      quantity: 0,
      description: 'Zero quantity',
    });
    throw new Error('TEST 6 FAILED: Quantity 0 accepted');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`REJECTED as expected: "${msg}"`);
  }

  // TEST 7: Quantity -5
  console.log('\n--- TEST 7: Quantity -5 ---');
  try {
    await inventoryService.recordStockMovement({
      productId,
      type: 'STOCK_IN',
      quantity: -5,
      description: 'Negative quantity',
    });
    throw new Error('TEST 7 FAILED: Negative quantity accepted');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`REJECTED as expected: "${msg}"`);
  }

  // TEST 8 & 9: Persistence verification from Appwrite
  console.log('\n--- TEST 8 & 9: Persistence Verification from Appwrite ---');
  const freshRead = await inventoryService.getInventoryByProductId(productId);
  console.log(`Fresh Appwrite read stock: ${freshRead?.stock} (Expected: 30)`);
  if (freshRead?.stock !== 30) throw new Error('TEST 8 & 9 FAILED');

  // TEST 10 & 11: Transaction History Verification
  console.log('\n--- TEST 10 & 11: Transaction History Verification ---');
  const history = await inventoryService.getTransactionHistory(productId);
  console.log(`Found ${history.length} transactions for test product.`);
  history.forEach((tx, idx) => {
    console.log(`  [${idx + 1}] ${tx.type} | Qty: ${tx.quantity} | Desc: "${tx.description}" | ${tx.stockBefore} -> ${tx.stockAfter} (${tx.createdAt})`);
  });

  const hasIn25 = history.some((tx) => tx.type === 'STOCK_IN' && tx.quantity === 25 && tx.stockBefore === 0 && tx.stockAfter === 25 && tx.description === 'Initial Restock Test 1');
  const hasIn10 = history.some((tx) => tx.type === 'STOCK_IN' && tx.quantity === 10 && tx.stockBefore === 25 && tx.stockAfter === 35 && tx.description === 'Restock Supplier Test 2');
  const hasOut5 = history.some((tx) => tx.type === 'STOCK_OUT' && tx.quantity === 5 && tx.stockBefore === 35 && tx.stockAfter === 30 && tx.description === 'Barang rusak Test 3');

  if (!hasIn25 || !hasIn10 || !hasOut5) {
    console.error('History validation failed: missing expected movement entries.');
    throw new Error('TEST 10 & 11 FAILED');
  }

  console.log('\n==================================================');
  console.log('ALL INVENTORY TESTS PASSED SUCCESSFULLY! ✓');
  console.log('==================================================');
}

runTests().catch((err) => {
  console.error('\nTEST RUNNER ERROR:', err);
  process.exit(1);
});
