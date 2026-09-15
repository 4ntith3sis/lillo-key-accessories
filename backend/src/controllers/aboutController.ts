import { Request, Response, NextFunction } from 'express';
import { aboutService } from '../services/aboutService.js';

export const getAboutHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await aboutService.getAboutContent();
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const updateAboutHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updated = await aboutService.updateAboutContent(req.body || {});
    res.json({
      success: true,
      message: 'About page content updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const uploadAboutAssetHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { image, filename } = req.body || {};
    if (!image) {
      res.status(400).json({
        success: false,
        error: 'Image base64 string is required.',
      });
      return;
    }

    const uploaded = await aboutService.uploadAboutAsset(image, filename || 'about_asset.jpg');
    res.json({
      success: true,
      data: {
        fileId: uploaded.fileId,
        url: uploaded.url,
      },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getAboutHandler,
  updateAboutHandler,
  uploadAboutAssetHandler,
};
