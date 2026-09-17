import { Request, Response, NextFunction } from 'express';
import {
  uploadProductImageFile,
  deleteProductImageFile,
} from '../services/productImageService.js';

export const uploadProductImageHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { image, filename } = req.body;
    if (!image || typeof image !== 'string') {
      res.status(400).json({ success: false, message: 'Image base64 data is required' });
      return;
    }

    const uploaded = await uploadProductImageFile(image, filename || 'product.jpg');
    res.status(201).json({
      success: true,
      data: uploaded,
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('UPLOAD_')) {
      const code = error.message === 'UPLOAD_TOO_LARGE' ? 413 : 400;
      const msg =
        error.message === 'UPLOAD_TOO_LARGE'
          ? 'Image exceeds the 5MB size limit'
          : 'Unsupported image type. Use JPG, PNG, or WEBP';
      res.status(code).json({ success: false, message: msg });
      return;
    }
    next(error);
  }
};

export const deleteProductImageHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      res.status(400).json({ success: false, message: 'File ID is required' });
      return;
    }

    await deleteProductImageFile(fileId);
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  uploadProductImageHandler,
  deleteProductImageHandler,
};
