import { Router } from 'express';
import {
  getAboutHandler,
  updateAboutHandler,
  uploadAboutAssetHandler,
} from '../controllers/aboutController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

// Public: GET /api/about
router.get('/', getAboutHandler);

// Admin: PATCH /api/about
router.patch('/', authMiddleware, adminMiddleware, updateAboutHandler);

// Admin: POST /api/about/assets
router.post('/assets', authMiddleware, adminMiddleware, uploadAboutAssetHandler);

export default router;
