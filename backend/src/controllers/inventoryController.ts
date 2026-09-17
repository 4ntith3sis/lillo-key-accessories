import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventoryService.js';

export const getAllInventoryHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const list = await inventoryService.getAllInventory();
    res.json({
      success: true,
      data: list,
    });
  } catch (err) {
    next(err);
  }
};

export const getInventoryByProductIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;
    const inv = await inventoryService.getInventoryByProductId(productId);
    res.json({
      success: true,
      data: inv || { id: `inv_${productId}`, productId, stock: 0 },
    });
  } catch (err) {
    next(err);
  }
};

export const updateInventoryHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;
    const { stock } = req.body;

    if (stock === undefined || stock === null || isNaN(Number(stock)) || Number(stock) < 0) {
      res.status(400).json({
        success: false,
        message: 'Stock must be a non-negative integer.',
      });
      return;
    }

    const updated = await inventoryService.updateInventory(productId, Number(stock));
    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const recordStockMovementHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, type, quantity, description } = req.body;

    if (!productId || typeof productId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Product ID (productId) is required.',
      });
      return;
    }

    if (type !== 'STOCK_IN' && type !== 'STOCK_OUT') {
      res.status(400).json({
        success: false,
        message: 'Transaction type must be STOCK_IN or STOCK_OUT.',
      });
      return;
    }

    const qtyNum = Number(quantity);
    if (isNaN(qtyNum) || !Number.isInteger(qtyNum) || qtyNum <= 0) {
      res.status(400).json({
        success: false,
        message: 'Quantity must be an integer greater than 0.',
      });
      return;
    }

    const cleanDesc = (description || '').trim();
    if (!cleanDesc) {
      res.status(400).json({
        success: false,
        message: 'Transaction description is required.',
      });
      return;
    }

    const result = await inventoryService.recordStockMovement({
      productId,
      type,
      quantity: qtyNum,
      description: cleanDesc,
    });

    res.json({
      success: true,
      message: `Stock ${type === 'STOCK_IN' ? 'In' : 'Out'} recorded successfully. Current stock: ${result.inventory.stock}`,
      data: result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Insufficient stock') || msg.includes('required') || msg.includes('integer greater than 0') || msg.includes('must be')) {
      res.status(400).json({
        success: false,
        message: msg,
      });
      return;
    }
    next(err);
  }
};

export const getTransactionHistoryHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productId = req.query.productId ? String(req.query.productId) : undefined;
    const history = await inventoryService.getTransactionHistory(productId);
    res.json({
      success: true,
      data: history,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getAllInventoryHandler,
  getInventoryByProductIdHandler,
  updateInventoryHandler,
  recordStockMovementHandler,
  getTransactionHistoryHandler,
};
