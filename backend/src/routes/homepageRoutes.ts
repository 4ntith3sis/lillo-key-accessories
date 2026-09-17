import { Router } from 'express';
import {
  getHomepageHandler,
  updateHomepageHandler,
  uploadHomepageAssetHandler,
} from '../controllers/homepageController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

// Public Read Endpoint
router.get('/', getHomepageHandler);

// Protected Admin Mutation Endpoints
router.patch('/', authMiddleware, adminMiddleware, updateHomepageHandler);
router.post('/assets', authMiddleware, adminMiddleware, uploadHomepageAssetHandler);

export default router;
