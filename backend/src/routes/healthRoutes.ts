import { Router } from 'express';
import { getHealth, getAppwriteHealth } from '../controllers/healthController.js';

const router = Router();

router.get('/', getHealth);
router.get('/appwrite', getAppwriteHealth);

export default router;
