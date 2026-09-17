import { Request, Response, NextFunction } from 'express';
import { getProducts } from '../services/productService.js';
import { getCategories } from '../services/categoryService.js';
import { inventoryService } from '../services/inventoryService.js';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let productsCount = 0;
    let categoriesCount = 0;
    let inventoryCount = 0;
    let totalStock = 0;

    try {
      const products = await getProducts();
      productsCount = products.length;
    } catch (err: unknown) {
      console.error('[Metrics] Products query failed:', err instanceof Error ? err.message : err);
      throw new Error(`Failed to load product metrics: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    try {
      const categories = await getCategories();
      categoriesCount = categories.length;
    } catch (err: unknown) {
      console.error('[Metrics] Categories query failed:', err instanceof Error ? err.message : err);
      throw new Error(`Failed to load category metrics: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    try {
      const inventories = await inventoryService.getAllInventory();
      inventoryCount = inventories.length;
      totalStock = inventories.reduce((sum, inv) => sum + (inv.stock || 0), 0);
    } catch (err: unknown) {
      console.warn('[Metrics] Inventory query warning:', err instanceof Error ? err.message : err);
    }

    res.status(200).json({
      success: true,
      data: {
        products: productsCount,
        categories: categoriesCount,
        inventory: inventoryCount,
        totalStock,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getDashboardStats,
};
