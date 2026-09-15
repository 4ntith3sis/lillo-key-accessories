import { Router, Request, Response, NextFunction } from 'express';
import { getHomepageHandler, updateHomepageHandler } from '../controllers/homepageController.js';
import { getAboutHandler, updateAboutHandler } from '../controllers/aboutController.js';
import { uploadCmsImageHandler, deleteCmsImageHandler } from '../controllers/cmsImageController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { homepageService } from '../services/homepageService.js';
import { aboutService } from '../services/aboutService.js';

const router = Router();

// ==========================================
// HOMEPAGE CMS ENDPOINTS
// ==========================================
router.get('/homepage', getHomepageHandler);

router.put('/homepage', authMiddleware, adminMiddleware, updateHomepageHandler);

router.put('/homepage/:section', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { section } = req.params;
    const updated = await homepageService.updateSection(section, req.body);
    res.status(200).json({
      success: true,
      data: updated,
      message: `Homepage section "${section}" updated successfully.`,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// ABOUT PAGE CMS ENDPOINTS
// ==========================================
router.get('/about', getAboutHandler);

router.put('/about', authMiddleware, adminMiddleware, updateAboutHandler);

router.put('/about/:section', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { section } = req.params;
    const updated = await aboutService.updateSection(section, req.body);
    res.status(200).json({
      success: true,
      data: updated,
      message: `About section "${section}" updated successfully.`,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// IMAGE ASSETS ENDPOINTS
// ==========================================
router.post('/images', authMiddleware, adminMiddleware, uploadCmsImageHandler);
router.delete('/images/:fileId', authMiddleware, adminMiddleware, deleteCmsImageHandler);

export default router;
