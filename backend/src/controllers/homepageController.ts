import { Request, Response, NextFunction } from 'express';
import { homepageService } from '../services/homepageService.js';

export const getHomepageHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await homepageService.getHomepageContent();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateHomepageHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updated = await homepageService.updateHomepageContent(req.body || {});
    res.status(200).json({
      success: true,
      data: updated,
      message: 'Homepage updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const uploadHomepageAssetHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { image, filename } = req.body || {};
    if (!image || typeof image !== 'string') {
      res.status(400).json({ success: false, message: 'Image base64 data is required' });
      return;
    }

    const uploaded = await homepageService.uploadHomepageAsset(image, filename || 'homepage_asset.jpg');
    res.status(200).json({
      success: true,
      data: uploaded,
      message: 'Asset uploaded successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getHomepageHandler,
  updateHomepageHandler,
  uploadHomepageAssetHandler,
};
