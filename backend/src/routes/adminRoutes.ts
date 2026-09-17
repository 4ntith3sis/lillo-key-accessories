import { Router } from 'express';
import { getDashboardStats } from '../controllers/adminController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

// Protected Admin Routes
router.get('/dashboard', authMiddleware, adminMiddleware, getDashboardStats);

export default router;
