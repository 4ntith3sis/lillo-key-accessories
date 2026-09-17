import { Request, Response, NextFunction } from 'express';
import { cmsImageService } from '../services/cmsImageService.js';

export const uploadCmsImageHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { image, filename } = req.body || {};
    if (!image || typeof image !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Image data (base64 string) is required.',
      });
      return;
    }

    const result = await cmsImageService.uploadCmsImage(image, filename || 'cms_asset.jpg');
    res.status(200).json({
      success: true,
      data: {
        fileId: result.fileId,
        url: result.url,
      },
      message: 'CMS image uploaded successfully.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to upload CMS image.',
    });
  }
};

export const deleteCmsImageHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      res.status(400).json({
        success: false,
        message: 'File ID parameter is required.',
      });
      return;
    }

    await cmsImageService.deleteOldCmsImage(fileId);
    res.status(200).json({
      success: true,
      message: 'CMS image deleted successfully.',
    });
  } catch (error: any) {
    next(error);
  }
};
