import { Router } from 'express';
import {
  getAllProducts,
  getSingleProduct,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
} from '../controllers/productController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

// Public Read Routes
router.get('/', getAllProducts);
router.get('/:id', getSingleProduct);

// Protected Admin Mutation Routes
router.post('/', authMiddleware, adminMiddleware, createProductHandler);
router.put('/:id', authMiddleware, adminMiddleware, updateProductHandler);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProductHandler);

export default router;
