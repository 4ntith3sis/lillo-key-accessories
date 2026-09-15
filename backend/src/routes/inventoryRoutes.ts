import { Router } from 'express';
import {
  getAllInventoryHandler,
  getInventoryByProductIdHandler,
  updateInventoryHandler,
  recordStockMovementHandler,
  getTransactionHistoryHandler,
} from '../controllers/inventoryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

// Public: GET /api/inventory
router.get('/', getAllInventoryHandler);

// Public / Admin: GET /api/inventory/transactions & /api/inventory/history
router.get('/transactions', getTransactionHistoryHandler);
router.get('/history', getTransactionHistoryHandler);

// Public: GET /api/inventory/:productId
router.get('/:productId', getInventoryByProductIdHandler);

// Admin Protected: POST /api/inventory/transactions & POST /api/inventory/transaction
router.post('/transactions', authMiddleware, adminMiddleware, recordStockMovementHandler);
router.post('/transaction', authMiddleware, adminMiddleware, recordStockMovementHandler);

// Admin Protected: PUT /api/inventory/:productId (Legacy direct update)
router.put('/:productId', authMiddleware, adminMiddleware, updateInventoryHandler);

export default router;
