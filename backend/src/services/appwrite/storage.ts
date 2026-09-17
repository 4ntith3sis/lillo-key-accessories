import { ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { appwriteStorage, isAppwriteConfigured } from '../../config/appwrite.js';
import { env } from '../../config/env.js';

export class AppwriteStorageService {
  private defaultBucketId: string;

  constructor() {
    this.defaultBucketId = env.appwrite.buckets.productImages;
  }

  getFileViewUrl(fileId: string, bucketId: string = this.defaultBucketId): string {
    if (!fileId) return '';
    if (fileId.startsWith('http://') || fileId.startsWith('https://') || fileId.startsWith('data:') || fileId.startsWith('/assets/') || fileId.startsWith('/uploads/')) {
      return fileId;
    }
    if (!isAppwriteConfigured()) {
      return '';
    }
    return `${env.appwrite.endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${env.appwrite.projectId}`;
  }

  getFilePreviewUrl(fileId: string, bucketId: string = this.defaultBucketId): string {
    if (!fileId) return '';
    if (fileId.startsWith('http://') || fileId.startsWith('https://') || fileId.startsWith('data:') || fileId.startsWith('/assets/') || fileId.startsWith('/uploads/')) {
      return fileId;
    }
    if (!isAppwriteConfigured()) {
      return '';
    }
    return `${env.appwrite.endpoint}/storage/buckets/${bucketId}/files/${fileId}/preview?project=${env.appwrite.projectId}`;
  }

  async uploadImage(base64Data: string, filename: string = 'product.jpg', bucketId: string = this.defaultBucketId): Promise<{ fileId: string; url: string }> {
    if (!base64Data) {
      throw new Error('No image data provided');
    }

    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    if (isAppwriteConfigured()) {
      try {
        const inputFile = InputFile.fromBuffer(buffer, filename);
        let activeBucket = bucketId;
        let response;
        try {
          response = await appwriteStorage.createFile(activeBucket, ID.unique(), inputFile);
        } catch (firstErr: any) {
          if (activeBucket !== this.defaultBucketId) {
            console.warn(`Appwrite bucket ${activeBucket} failed, trying default bucket ${this.defaultBucketId}:`, firstErr?.message);
            activeBucket = this.defaultBucketId;
            response = await appwriteStorage.createFile(activeBucket, ID.unique(), inputFile);
          } else {
            throw firstErr;
          }
        }
        const url = this.getFileViewUrl(response.$id, activeBucket);

        return {
          fileId: response.$id,
          url: url || base64Data,
        };
      } catch (error: any) {
        console.error('Appwrite Storage upload error:', error?.message || error);
        throw new Error(`Appwrite Storage upload failed: ${error?.message || String(error)}`);
      }
    }

    throw new Error('Appwrite Storage is not configured in backend environment');
  }

  async deleteImage(fileId: string, bucketId: string = this.defaultBucketId): Promise<boolean> {
    if (!isAppwriteConfigured() || !fileId || fileId.startsWith('data:') || fileId.startsWith('/assets/') || fileId.startsWith('/uploads/')) {
      return true;
    }

    try {
      await appwriteStorage.deleteFile(bucketId, fileId);
      return true;
    } catch (error: any) {
      if (bucketId !== this.defaultBucketId) {
        try {
          await appwriteStorage.deleteFile(this.defaultBucketId, fileId);
          return true;
        } catch (_) {}
      }
      console.warn(`Appwrite Storage delete error for file ${fileId}:`, error?.message || error);
      return false;
    }
  }
}

export const appwriteStorageService = new AppwriteStorageService();
export default appwriteStorageService;
