import { Models } from 'node-appwrite';
import { appwriteDatabaseService } from './appwrite/database.js';
import { getProducts } from './productService.js';
import { env } from '../config/env.js';
import { isAppwriteConfigured } from '../config/appwrite.js';
import { Category } from '../types/category.js';

type CategoryDocument = Models.Document & {
  name: string;
  slug: string;
  description?: string;
};

// Dev/offline fallback ONLY. Used solely when Appwrite is NOT configured.
// Never merged into production results — when Appwrite is configured, the
// database is the single source of truth.
let inMemoryCategories: Category[] = [
  { $id: 'luck', name: 'LUCK', slug: 'luck', description: 'Lucky Charms & Traditional Symbols' },
  { $id: 'animals', name: 'ANIMALS', slug: 'animals', description: 'Cute & Majestic Creature Charms' },
  { $id: 'studio', name: 'STUDIO', slug: 'studio', description: 'Craftsmanship & Music Accessories' },
  { $id: 'play', name: 'PLAY', slug: 'play', description: 'Toys & Gaming Accessories' },
];

const mapDocumentToCategory = (doc: CategoryDocument): Category => ({
  $id: doc.$id,
  name: doc.name,
  slug: doc.slug,
  description: doc.description,
  createdAt: doc.$createdAt,
  updatedAt: doc.$updatedAt,
});

const generateSlug = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'category';
};

export const getCategories = async (): Promise<Category[]> => {
  // Production path: strictly Appwrite-backed.
  if (isAppwriteConfigured()) {
    const collectionId = env.appwrite.tables.categories;
    const docs = await appwriteDatabaseService.listDocuments<CategoryDocument>(collectionId);
    return docs.map(mapDocumentToCategory);
  }

  // Dev/offline path: in-memory seed only.
  return inMemoryCategories.map((c) => ({ ...c }));
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
  if (isAppwriteConfigured()) {
    const collectionId = env.appwrite.tables.categories;
    const doc = await appwriteDatabaseService.getDocument<CategoryDocument>(collectionId, id);
    if (doc) return mapDocumentToCategory(doc);
    return null;
  }

  const found = inMemoryCategories.find(c => c.$id === id || c.slug === id);
  return found ? { ...found } : null;
};

export const createCategory = async (data: {
  name: string;
  slug?: string;
  description?: string;
}): Promise<Category> => {
  const collectionId = env.appwrite.tables.categories;
  const docId = `cat_${Date.now()}`;
  const slug = data.slug || generateSlug(data.name);

  const existing = await getCategories();
  if (existing.some((c) => c.slug.toLowerCase() === slug.toLowerCase())) {
    throw new Error('SLUG_CONFLICT');
  }

  const payload = {
    name: data.name.trim(),
    slug,
    description: data.description || '',
  };

  if (isAppwriteConfigured()) {
    const createdDoc = await appwriteDatabaseService.createDocument<CategoryDocument>(
      collectionId,
      payload,
      docId
    );
    if (!createdDoc) {
      throw new Error('Failed to create category');
    }
    return mapDocumentToCategory(createdDoc);
  }

  // Dev/offline fallback.
  const fallbackCategory: Category = {
    $id: docId,
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  inMemoryCategories.push(fallbackCategory);
  return { ...fallbackCategory };
};

export const updateCategory = async (
  id: string,
  data: Partial<{
    name: string;
    slug?: string;
    description?: string;
  }>
): Promise<Category | null> => {
  const collectionId = env.appwrite.tables.categories;

  if (data.slug !== undefined || data.name !== undefined) {
    const existing = await getCategories();
    const newSlug = data.slug || (data.name ? generateSlug(data.name) : undefined);
    if (newSlug && existing.some((c) => c.$id !== id && c.slug.toLowerCase() === newSlug.toLowerCase())) {
      throw new Error('SLUG_CONFLICT');
    }
  }

  const payload: Record<string, string> = {};
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.slug !== undefined) payload.slug = data.slug;
  else if (data.name !== undefined) payload.slug = generateSlug(data.name);
  if (data.description !== undefined) payload.description = data.description;

  if (isAppwriteConfigured()) {
    const updatedDoc = await appwriteDatabaseService.updateDocument<CategoryDocument>(
      collectionId,
      id,
      payload
    );
    if (!updatedDoc) return null;
    return mapDocumentToCategory(updatedDoc);
  }

  const idx = inMemoryCategories.findIndex(c => c.$id === id);
  if (idx > -1) {
    const updated: Category = {
      ...inMemoryCategories[idx],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    inMemoryCategories[idx] = updated;
    return { ...updated };
  }

  return null;
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  // Category delete protection check: check if any product references this category ID or category name
  const allProducts = await getProducts();
  const categoryObj = await getCategoryById(id);

  const isUsed = allProducts.some(p => {
    if (p.categoryId === id) return true;
    if (categoryObj && (p.categoryId === categoryObj.$id || p.categoryId === categoryObj.slug)) return true;
    return false;
  });

  if (isUsed) {
    throw new Error('THIS CATEGORY IS CURRENTLY USED BY PRODUCTS.');
  }

  const collectionId = env.appwrite.tables.categories;
  await appwriteDatabaseService.deleteDocument(collectionId, id);
  inMemoryCategories = inMemoryCategories.filter(c => c.$id !== id);
  return true;
};

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};