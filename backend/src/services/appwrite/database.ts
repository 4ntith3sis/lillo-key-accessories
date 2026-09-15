import { Query, Models } from 'node-appwrite';
import { appwriteDatabases, isAppwriteConfigured } from '../../config/appwrite.js';
import { env } from '../../config/env.js';

export class AppwriteDatabaseService {
  private databaseId: string;

  constructor() {
    this.databaseId = env.appwrite.databaseId;
  }

  async listDocuments<T extends Models.Document>(
    collectionId: string,
    queries: string[] = []
  ): Promise<T[]> {
    if (!isAppwriteConfigured()) {
      return [];
    }

    try {
      const finalQueries = queries.some((q) => q.includes('limit('))
        ? queries
        : [Query.limit(5000), ...queries];

      const response = await appwriteDatabases.listDocuments<T>(
        this.databaseId,
        collectionId,
        finalQueries
      );
      return response.documents;
    } catch (error: any) {
      console.warn(`Appwrite listDocuments warning for ${collectionId}:`, error?.message || error);
      return [];
    }
  }

  async getDocument<T extends Models.Document>(
    collectionId: string,
    documentId: string
  ): Promise<T | null> {
    if (!isAppwriteConfigured()) {
      return null;
    }

    try {
      const document = await appwriteDatabases.getDocument<T>(
        this.databaseId,
        collectionId,
        documentId
      );
      return document;
    } catch (error: any) {
      if (error?.code === 404 || error?.status === 404) {
        return null;
      }
      console.warn(`Appwrite getDocument warning for ${collectionId}/${documentId}:`, error?.message || error);
      return null;
    }
  }

  async createDocument<T extends Models.Document>(
    collectionId: string,
    data: Record<string, any>,
    documentId: string = 'unique()'
  ): Promise<T | null> {
    if (!isAppwriteConfigured()) {
      return null;
    }

    try {
      const document = await appwriteDatabases.createDocument<T>(
        this.databaseId,
        collectionId,
        documentId,
        data as any
      );
      return document;
    } catch (error: any) {
      console.error(`Appwrite createDocument error for ${collectionId}:`, error?.message || error);
      throw error;
    }
  }

  async updateDocument<T extends Models.Document>(
    collectionId: string,
    documentId: string,
    data: Record<string, any>
  ): Promise<T | null> {
    if (!isAppwriteConfigured()) {
      return null;
    }

    try {
      const document = await appwriteDatabases.updateDocument<T>(
        this.databaseId,
        collectionId,
        documentId,
        data as any
      );
      return document;
    } catch (error: any) {
      console.error(`Appwrite updateDocument error for ${collectionId}/${documentId}:`, error?.message || error);
      throw error;
    }
  }

  async deleteDocument(collectionId: string, documentId: string): Promise<void> {
    if (!isAppwriteConfigured()) {
      throw new Error('Appwrite is not configured');
    }

    try {
      await appwriteDatabases.deleteDocument(this.databaseId, collectionId, documentId);
    } catch (error: any) {
      console.error(`Appwrite deleteDocument error for ${collectionId}/${documentId}:`, error?.message || error);
      throw error;
    }
  }
}

export const appwriteDatabaseService = new AppwriteDatabaseService();
export default appwriteDatabaseService;
