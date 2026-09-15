import { Router } from 'express';
import {
  getAllCategories,
  getSingleCategory,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from '../controllers/categoryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

// Public Read Routes
router.get('/', getAllCategories);
router.get('/:id', getSingleCategory);

// Protected Admin Mutation Routes
router.post('/', authMiddleware, adminMiddleware, createCategoryHandler);
router.put('/:id', authMiddleware, adminMiddleware, updateCategoryHandler);
router.delete('/:id', authMiddleware, adminMiddleware, deleteCategoryHandler);

export default router;
