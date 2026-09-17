import { Router } from 'express';
import {
  uploadProductImageHandler,
  deleteProductImageHandler,
} from '../controllers/productImageController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

// Protected Admin Image Routes
router.post('/', authMiddleware, adminMiddleware, uploadProductImageHandler);
router.delete('/:fileId', authMiddleware, adminMiddleware, deleteProductImageHandler);

export default router;
