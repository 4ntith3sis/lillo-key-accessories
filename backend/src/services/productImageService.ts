import { appwriteStorageService } from './appwrite/storage.js';
import { env } from '../config/env.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const DATA_URI_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/;

export const uploadProductImageFile = async (
  base64Data: string,
  filename = 'product.jpg'
): Promise<{ fileId: string; url: string }> => {
  const match = DATA_URI_RE.exec(base64Data);
  if (!match) {
    throw new Error('UPLOAD_UNSUPPORTED_TYPE');
  }
  const mime = match[1].toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error('UPLOAD_UNSUPPORTED_TYPE');
  }

  const base64Clean = base64Data.replace(DATA_URI_RE, '');
  const size = Math.floor((base64Clean.length * 3) / 4);
  if (size > MAX_IMAGE_BYTES) {
    throw new Error('UPLOAD_TOO_LARGE');
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_') || 'product.jpg';
  return appwriteStorageService.uploadImage(base64Data, safeName, env.appwrite.buckets.productImages);
};

export const deleteProductImageFile = async (fileId: string): Promise<boolean> => {
  return appwriteStorageService.deleteImage(fileId, env.appwrite.buckets.productImages);
};

export const extractFileIdFromUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  const match = /\/files\/([^/?#]+)/.exec(url);
  return match ? match[1] : null;
};

export default {
  uploadProductImageFile,
  deleteProductImageFile,
  extractFileIdFromUrl,
};
