import { appwriteStorageService } from './appwrite/storage.js';
import { env } from '../config/env.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export interface CmsUploadResult {
  fileId: string;
  url: string;
}

export class CmsImageService {
  /**
   * Validates and uploads a base64 encoded image string to Appwrite Storage.
   */
  async uploadCmsImage(
    base64Data: string,
    filename: string = 'cms_image.jpg',
    bucketId: string = env.appwrite.buckets.homepageAssets
  ): Promise<CmsUploadResult> {
    if (!base64Data || typeof base64Data !== 'string') {
      throw new Error('Image data is missing or invalid.');
    }

    // 1. Validate extension
    const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : '';
    if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
      throw new Error(`File type .${ext} is not allowed. Only JPG, JPEG, PNG, and WEBP files are permitted.`);
    }

    // 2. Validate MIME type from Data URI if present
    const mimeMatch = base64Data.match(/^data:(image\/[a-zA-Z0-9+-]+);base64,/);
    if (mimeMatch) {
      const mime = mimeMatch[1].toLowerCase();
      if (!ALLOWED_MIME_TYPES.has(mime)) {
        throw new Error(`MIME type ${mime} is not allowed. Only JPG, PNG, and WEBP images are permitted.`);
      }
    }

    // 3. Clean base64 and validate size limit
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const estimatedSizeBytes = Math.round((base64Clean.length * 3) / 4);
    if (estimatedSizeBytes > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed limit of 10MB.`);
    }

    // 4. Upload to Appwrite Storage
    const result = await appwriteStorageService.uploadImage(base64Data, filename, bucketId);
    return result;
  }

  /**
   * Safely replaces an old CMS image with a new base64 image:
   * 1. Upload new image to Appwrite Storage
   * 2. Return new image result
   * 3. Optionally delete old image file if oldFileId provided (called AFTER DB update)
   */
  async deleteOldCmsImage(
    fileId: string,
    bucketId: string = env.appwrite.buckets.homepageAssets
  ): Promise<boolean> {
    if (!fileId) return true;
    return appwriteStorageService.deleteImage(fileId, bucketId);
  }
}

export const cmsImageService = new CmsImageService();
export default cmsImageService;
