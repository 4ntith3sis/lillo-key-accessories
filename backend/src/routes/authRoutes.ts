import { Router } from 'express';
import { loginHandler, logoutHandler, getMeHandler } from '../controllers/authController.js';

const router = Router();

router.post('/login', loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', getMeHandler);

export default router;
