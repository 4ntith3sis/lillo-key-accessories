import { Models } from 'node-appwrite';
import { appwriteDatabaseService } from './appwrite/database.js';
import { appwriteStorageService } from './appwrite/storage.js';
import { isAppwriteConfigured } from '../config/appwrite.js';
import { env } from '../config/env.js';
import { AboutContent, DEFAULT_ABOUT_CONTENT } from '../types/about.js';

// In-memory cache — only used if Appwrite is unreachable (true fallback)
let cachedAboutContent: AboutContent | null = null;

export class AboutService {
  private docId = 'about_main';

  async getAboutContent(): Promise<AboutContent> {
    const collectionId = env.appwrite.tables.aboutContent;

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
          const result = this.mergeContent(DEFAULT_ABOUT_CONTENT, parsed as Partial<AboutContent>);
          cachedAboutContent = result;
          return result;
        }
        // Document exists but no contentJson — return defaults (no cache override)
        return { ...DEFAULT_ABOUT_CONTENT };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('Appwrite getAboutContent error, using memory cache or defaults:', msg);
        // Only use memory cache if Appwrite is truly unreachable
        if (cachedAboutContent) {
          return cachedAboutContent;
        }
        return { ...DEFAULT_ABOUT_CONTENT };
      }
    }

    // Appwrite not configured — return memory cache or defaults
    return cachedAboutContent ?? { ...DEFAULT_ABOUT_CONTENT };
  }

  async updateAboutContent(incomingData: Partial<AboutContent>): Promise<AboutContent> {
    const current = await this.getAboutContent();
    const merged = this.mergeContent(current, incomingData);
    merged.updatedAt = new Date().toISOString();

    const collectionId = env.appwrite.tables.aboutContent;

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
      cachedAboutContent = merged;
      return merged;
    }

    // Appwrite not configured — memory-only store
    cachedAboutContent = merged;
    return merged;
  }

  async uploadAboutAsset(
    base64Data: string,
    filename = 'about_asset.jpg'
  ): Promise<{ fileId: string; url: string }> {
    if (!base64Data) {
      throw new Error('No image data provided');
    }
    const bucketId = env.appwrite.buckets.homepageAssets || env.appwrite.buckets.productImages;
    return appwriteStorageService.uploadImage(base64Data, filename, bucketId);
  }

  async updateSection(sectionName: string, sectionData: unknown): Promise<AboutContent> {
    const patch: Partial<AboutContent> = {
      [sectionName]: sectionData,
    };
    return this.updateAboutContent(patch);
  }

  private mergeContent(base: AboutContent, patch: Partial<AboutContent>): AboutContent {
    return {
      hero: { ...base.hero, ...(patch.hero || {}) },
      manifesto: {
        ...base.manifesto,
        ...(patch.manifesto || {}),
        stats: patch.manifesto?.stats ? [...patch.manifesto.stats] : [...base.manifesto.stats],
      },
      imageBreak: { ...base.imageBreak, ...(patch.imageBreak || {}) },
      story: {
        ...base.story,
        ...(patch.story || {}),
        points: patch.story?.points ? [...patch.story.points] : [...base.story.points],
      },
      timeline: {
        ...base.timeline,
        ...(patch.timeline || {}),
        items: patch.timeline?.items ? [...patch.timeline.items] : [...base.timeline.items],
      },
      values: {
        ...base.values,
        ...(patch.values || {}),
        items: patch.values?.items ? [...patch.values.items] : [...base.values.items],
      },
      closing: { ...base.closing, ...(patch.closing || {}) },
      updatedAt: patch.updatedAt || base.updatedAt,
    };
  }
}

export const aboutService = new AboutService();
export default aboutService;
