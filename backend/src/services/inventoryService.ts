import { Query, Models } from 'node-appwrite';
import { appwriteDatabaseService } from './appwrite/database.js';
import { isAppwriteConfigured } from '../config/appwrite.js';
import { env } from '../config/env.js';
import { Inventory } from '../types/inventory.js';
import { InventoryTransaction, StockMovementInput, StockTransactionType } from '../types/inventoryTransaction.js';

interface AppwriteInventoryDoc extends Models.Document {
  product_id?: string;
  productId?: string;
  stock?: number;
  updated_at?: string;
}

interface AppwriteTransactionDoc extends Models.Document {
  product_id: string;
  type: StockTransactionType;
  quantity: number;
  description: string;
  stock_before: number;
  stock_after: number;
  created_at: string;
}

export class InventoryService {
  private collectionId = env.appwrite.tables.inventory;
  private transactionsCollectionId = env.appwrite.tables.inventoryTransactions;

  private transformDoc(doc: AppwriteInventoryDoc): Inventory {
    return {
      id: doc.$id,
      productId: doc.product_id || doc.productId || '',
      stock: Math.max(0, Math.floor(Number(doc.stock) || 0)),
      updatedAt: doc.$updatedAt || doc.$createdAt,
    };
  }

  private transformTransactionDoc(doc: AppwriteTransactionDoc): InventoryTransaction {
    return {
      id: doc.$id,
      productId: doc.product_id,
      type: doc.type,
      quantity: Number(doc.quantity),
      description: doc.description || '',
      stockBefore: Number(doc.stock_before),
      stockAfter: Number(doc.stock_after),
      createdAt: doc.created_at || doc.$createdAt,
    };
  }

  async getAllInventory(): Promise<Inventory[]> {
    if (isAppwriteConfigured()) {
      try {
        const docs = await appwriteDatabaseService.listDocuments<AppwriteInventoryDoc>(
          this.collectionId,
          [Query.limit(100)]
        );
        return docs.map((doc) => this.transformDoc(doc));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('Appwrite getAllInventory warning:', msg);
        return [];
      }
    }
    return [];
  }

  async getInventoryByProductId(productId: string): Promise<Inventory | null> {
    if (isAppwriteConfigured()) {
      try {
        const docs = await appwriteDatabaseService.listDocuments<AppwriteInventoryDoc>(
          this.collectionId,
          [Query.equal('product_id', productId), Query.limit(1)]
        );
        if (docs.length > 0) {
          return this.transformDoc(docs[0]);
        }
        return null;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Appwrite getInventoryByProductId warning for ${productId}:`, msg);
        return null;
      }
    }
    return null;
  }

  async updateInventory(productId: string, stock: number): Promise<Inventory> {
    const cleanStock = Math.max(0, Math.floor(Number(stock) || 0));
    const now = new Date().toISOString();

    if (!isAppwriteConfigured()) {
      throw new Error('Appwrite Database is not configured');
    }

    const docs = await appwriteDatabaseService.listDocuments<AppwriteInventoryDoc>(
      this.collectionId,
      [Query.equal('product_id', productId), Query.limit(1)]
    );

    if (docs.length > 0) {
      const docId = docs[0].$id;
      const updatedDoc = await appwriteDatabaseService.updateDocument<AppwriteInventoryDoc>(
        this.collectionId,
        docId,
        { stock: cleanStock, updated_at: now }
      );
      if (!updatedDoc) {
        throw new Error(`Appwrite updateDocument returned null for inventory ${productId}`);
      }
      return this.transformDoc(updatedDoc);
    } else {
      const createdDoc = await appwriteDatabaseService.createDocument<AppwriteInventoryDoc>(
        this.collectionId,
        { product_id: productId, stock: cleanStock, updated_at: now }
      );
      if (!createdDoc) {
        throw new Error(`Appwrite createDocument returned null for inventory ${productId}`);
      }
      return this.transformDoc(createdDoc);
    }
  }

  async recordStockMovement(input: StockMovementInput): Promise<{ inventory: Inventory; transaction: InventoryTransaction }> {
    const { productId, type, quantity, description } = input;

    // 1. Validate Quantity
    const qtyNum = Number(quantity);
    if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
      throw new Error('Quantity must be an integer greater than 0.');
    }

    // 2. Validate Description
    const cleanDesc = (description || '').trim();
    if (!cleanDesc) {
      throw new Error('Transaction description is required.');
    }

    // 3. Validate Type
    if (type !== 'STOCK_IN' && type !== 'STOCK_OUT') {
      throw new Error('Transaction type must be STOCK_IN or STOCK_OUT.');
    }

    if (!isAppwriteConfigured()) {
      throw new Error('Appwrite Database is not configured');
    }

    // 4. Read current stock from Appwrite (Source of Truth)
    const currentInv = await this.getInventoryByProductId(productId);
    const stockBefore = currentInv ? currentInv.stock : 0;

    let stockAfter = stockBefore;
    if (type === 'STOCK_IN') {
      stockAfter = stockBefore + qtyNum;
    } else if (type === 'STOCK_OUT') {
      if (stockBefore < qtyNum) {
        throw new Error('Insufficient stock.');
      }
      stockAfter = stockBefore - qtyNum;
    }

    const now = new Date().toISOString();

    // 5. Update Inventory in Appwrite
    const updatedInventory = await this.updateInventory(productId, stockAfter);

    // 6. Record Transaction History in Appwrite
    let createdTransactionDoc: AppwriteTransactionDoc | null = null;
    try {
      createdTransactionDoc = await appwriteDatabaseService.createDocument<AppwriteTransactionDoc>(
        this.transactionsCollectionId,
        {
          product_id: productId,
          type,
          quantity: qtyNum,
          description: cleanDesc,
          stock_before: stockBefore,
          stock_after: stockAfter,
          created_at: now,
        }
      );
    } catch (txErr: unknown) {
      const msg = txErr instanceof Error ? txErr.message : String(txErr);
      console.error(`FAILED to save transaction history for ${productId}:`, msg);
      throw new Error(`Stock updated to ${stockAfter}, but failed to save transaction history: ${msg}`);
    }

    if (!createdTransactionDoc) {
      throw new Error('Failed to save transaction history to Appwrite.');
    }

    return {
      inventory: updatedInventory,
      transaction: this.transformTransactionDoc(createdTransactionDoc),
    };
  }

  async getTransactionHistory(productId?: string): Promise<InventoryTransaction[]> {
    if (!isAppwriteConfigured()) {
      return [];
    }

    try {
      const queries = [Query.limit(100), Query.orderDesc('created_at')];
      if (productId) {
        queries.push(Query.equal('product_id', productId));
      }
      const docs = await appwriteDatabaseService.listDocuments<AppwriteTransactionDoc>(
        this.transactionsCollectionId,
        queries
      );
      return docs.map((doc) => this.transformTransactionDoc(doc));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Appwrite getTransactionHistory warning:', msg);
      return [];
    }
  }

  async deleteInventoryByProductId(productId: string): Promise<boolean> {
    if (isAppwriteConfigured()) {
      try {
        const docs = await appwriteDatabaseService.listDocuments<AppwriteInventoryDoc>(
          this.collectionId,
          [Query.equal('product_id', productId), Query.limit(1)]
        );
        if (docs.length > 0) {
          await appwriteDatabaseService.deleteDocument(this.collectionId, docs[0].$id);
        }
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Appwrite deleteInventoryByProductId warning for ${productId}:`, msg);
        return false;
      }
    }
    return true;
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
