import { Models } from 'node-appwrite';
import { appwriteDatabaseService } from './appwrite/database.js';
import { appwriteStorageService } from './appwrite/storage.js';
import { isAppwriteConfigured } from '../config/appwrite.js';
import { env } from '../config/env.js';
import { HomepageContent, DEFAULT_HOMEPAGE_CONTENT } from '../types/homepage.js';

// In-memory cache — only used if Appwrite is unreachable (true fallback)
let cachedHomepageContent: HomepageContent | null = null;

export class HomepageService {
  private docId = 'homepage_main';

  async getHomepageContent(): Promise<HomepageContent> {
    const collectionId = env.appwrite.tables.homepageContent;

    if (isAppwriteConfigured()) {
      try {
        const doc = await appwriteDatabaseService.getDocument<Models.Document & { contentJson?: unknown }>(
          collectionId,
          this.docId
        );
        if (doc && doc.contentJson) {
          const parsed =
            typeof doc.contentJson === 'string'
              ? JSON.parse(doc.contentJson as string)
              : doc.contentJson;
          const result = this.mergeContent(DEFAULT_HOMEPAGE_CONTENT, parsed as Partial<HomepageContent>);
          cachedHomepageContent = result;
          return result;
        }
        // Document exists but no contentJson — return defaults (no cache override)
        return { ...DEFAULT_HOMEPAGE_CONTENT };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('Appwrite getHomepageContent error, using memory cache or defaults:', msg);
        // Only use memory cache if Appwrite is truly unreachable
        if (cachedHomepageContent) {
          return cachedHomepageContent;
        }
        return { ...DEFAULT_HOMEPAGE_CONTENT };
      }
    }

    // Appwrite not configured — return memory cache or defaults
    return cachedHomepageContent ?? { ...DEFAULT_HOMEPAGE_CONTENT };
  }

  async updateHomepageContent(incomingData: Partial<HomepageContent>): Promise<HomepageContent> {
    const current = await this.getHomepageContent();
    const merged = this.mergeContent(current, incomingData);
    merged.updatedAt = new Date().toISOString();

    const collectionId = env.appwrite.tables.homepageContent;

    if (isAppwriteConfigured()) {
      const payload = {
        contentJson: JSON.stringify(merged),
        updatedAt: merged.updatedAt,
      };

      // Throws on failure — do NOT catch here so callers know persistence failed
      const existing = await appwriteDatabaseService.getDocument(collectionId, this.docId).catch(() => null);
      if (existing) {
        await appwriteDatabaseService.updateDocument(collectionId, this.docId, payload);
      } else {
        await appwriteDatabaseService.createDocument(collectionId, payload, this.docId);
      }

      // Only update cache after confirmed DB write
      cachedHomepageContent = merged;
      return merged;
    }

    // Appwrite not configured — memory-only store
    cachedHomepageContent = merged;
    return merged;
  }

  async uploadHomepageAsset(
    base64Data: string,
    filename = 'homepage_asset.jpg'
  ): Promise<{ fileId: string; url: string }> {
    if (!base64Data) {
      throw new Error('No image data provided');
    }
    const bucketId = env.appwrite.buckets.homepageAssets || env.appwrite.buckets.productImages;
    return appwriteStorageService.uploadImage(base64Data, filename, bucketId);
  }

  async updateSection(sectionName: string, sectionData: unknown): Promise<HomepageContent> {
    const patch: Partial<HomepageContent> = {
      [sectionName]: sectionData,
    };
    return this.updateHomepageContent(patch);
  }

  private mergeContent(base: HomepageContent, patch: Partial<HomepageContent>): HomepageContent {
    return {
      hero: { ...base.hero, ...(patch.hero || {}) },
      brandStatement: {
        ...base.brandStatement,
        ...(patch.brandStatement || {}),
        specs: patch.brandStatement?.specs ? [...patch.brandStatement.specs] : [...base.brandStatement.specs],
      },
      categorySection: { ...base.categorySection, ...(patch.categorySection || {}) },
      craftsmanship: {
        ...base.craftsmanship,
        ...(patch.craftsmanship || {}),
        features: patch.craftsmanship?.features
          ? [...patch.craftsmanship.features]
          : [...base.craftsmanship.features],
      },
      journal: { ...base.journal, ...(patch.journal || {}) },
      cta: {
        ...base.cta,
        ...(patch.cta || {}),
        features: patch.cta?.features ? [...patch.cta.features] : [...base.cta.features],
      },
      updatedAt: patch.updatedAt || base.updatedAt,
    };
  }
}

export const homepageService = new HomepageService();
export default homepageService;
