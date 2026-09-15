import { Query, Models, ID } from 'node-appwrite';
import { appwriteDatabaseService } from './appwrite/database.js';
import { inventoryService } from './inventoryService.js';
import {
  extractFileIdFromUrl,
  deleteProductImageFile,
} from './productImageService.js';
import { isAppwriteConfigured } from '../config/appwrite.js';
import { env } from '../config/env.js';
import { Product } from '../types/product.js';

/** Outcome of an associated storage-file cleanup attempt. */
export type ImageCleanupStatus =
  | 'deleted'
  | 'shared-skipped'
  | 'no-image'
  | 'not-storage-file'
  | 'failed';

/**
 * Schema Phase 3 — Appwrite products collection attributes:
 *   name, slug, description, price, category_id, image
 *
 * NOT in schema: isFeatured, featured, size, sizeId, inStock
 * Never send fields that are not in the Appwrite collection schema.
 */
type ProductDocument = Models.Document & {
  name: string;
  slug: string;
  description?: string;
  price: number;
  category_id?: string;
  categoryId?: string;
  image?: string;
  images?: string[];
};

const mapDocumentToProduct = (doc: ProductDocument): Product => ({
  $id: doc.$id,
  name: doc.name,
  slug: doc.slug,
  description: doc.description,
  price: Number(doc.price) || 0,
  categoryId: doc.category_id || doc.categoryId,
  images: doc.images || (doc.image ? [doc.image] : []),
  createdAt: doc.$createdAt,
  updatedAt: doc.$updatedAt,
});

const generateSlug = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'product';
};

const productImageUrls = (p: Product): string[] => {
  const urls = [...(p.images || [])];
  const legacy = (p as { image?: unknown }).image;
  if (typeof legacy === 'string' && legacy && !urls.includes(legacy)) urls.push(legacy);
  return urls;
};

/**
 * Ownership check: is this storage file referenced by any product other
 * than the excluded one? Never delete a file that belongs to another product.
 */
export const isImageFileUsedByOtherProducts = async (
  fileId: string,
  excludeProductId?: string
): Promise<boolean> => {
  const all = await getProducts();
  return all.some(
    (p) =>
      p.$id !== excludeProductId &&
      productImageUrls(p).some((url) => url.includes(fileId))
  );
};

/**
 * Delete a storage file ONLY when no other product references it.
 * Safe direction: on any doubt or failure the file is kept.
 */
export const deleteImageFileIfExclusive = async (
  imageUrl: string | undefined,
  excludeProductId?: string
): Promise<ImageCleanupStatus> => {
  if (!imageUrl) return 'no-image';
  const fileId = extractFileIdFromUrl(imageUrl);
  if (!fileId) return 'not-storage-file';
  try {
    if (await isImageFileUsedByOtherProducts(fileId, excludeProductId)) {
      return 'shared-skipped';
    }
    await deleteProductImageFile(fileId);
    return 'deleted';
  } catch (err: unknown) {
    console.warn(
      `Image cleanup failed for file ${fileId}:`,
      err instanceof Error ? err.message : err
    );
    return 'failed';
  }
};

export const getProducts = async (): Promise<Product[]> => {
  const collectionId = env.appwrite.tables.products;
  const docs = await appwriteDatabaseService.listDocuments<ProductDocument>(collectionId);
  return docs.map(mapDocumentToProduct);
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const collectionId = env.appwrite.tables.products;
  const doc = await appwriteDatabaseService.getDocument<ProductDocument>(collectionId, id);
  if (doc) return mapDocumentToProduct(doc);

  const all = await getProducts();
  const found = all.find((p) => p.$id === id || p.slug === id);
  return found || null;
};

export const createProduct = async (data: {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  categoryId?: string;
  images?: string[];
}): Promise<Product> => {
  const collectionId = env.appwrite.tables.products;
  const docId = `prod_${Date.now()}`;
  const slug = data.slug || generateSlug(data.name);

  const existing = await getProducts();
  if (existing.some((p) => p.slug.toLowerCase() === slug.toLowerCase())) {
    throw new Error('SLUG_CONFLICT');
  }

  // Explicit payload — ONLY fields present in Appwrite schema Phase 3.
  // Do NOT add isFeatured, inStock, size, or any field not in the schema.
  const payload = {
    name: data.name.trim(),
    slug,
    description: data.description || '',
    price: Number(data.price) || 0,
    category_id: data.categoryId || '',
    image: (data.images || [])[0] || '',
  };

  const createdDoc = await appwriteDatabaseService.createDocument<ProductDocument>(
    collectionId,
    payload,
    docId
  );

  if (!createdDoc) {
    throw new Error('Failed to create product in Appwrite Database');
  }

  const createdProduct = mapDocumentToProduct(createdDoc);
  // Create initial inventory record (default stock: 0)
  try {
    await inventoryService.updateInventory(createdProduct.$id, 0);
  } catch (err) {
    console.warn('Failed to create initial inventory for product:', err);
  }

  return createdProduct;
};

export const updateProduct = async (
  id: string,
  data: Partial<{
    name: string;
    slug?: string;
    description?: string;
    price: number;
    categoryId?: string;
    images?: string[];
  }>
): Promise<Product | null> => {
  const collectionId = env.appwrite.tables.products;

  if (data.slug !== undefined || data.name !== undefined) {
    const existing = await getProducts();
    const newSlug = data.slug || (data.name ? generateSlug(data.name) : undefined);
    if (newSlug && existing.some((p) => p.$id !== id && p.slug.toLowerCase() === newSlug.toLowerCase())) {
      throw new Error('SLUG_CONFLICT');
    }
  }

  // Explicit payload — ONLY fields present in Appwrite schema Phase 3.
  // Do NOT add isFeatured, inStock, size, or any field not in the schema.
  const payload: Record<string, string | number | boolean | string[]> = {};
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.slug !== undefined) payload.slug = data.slug;
  else if (data.name !== undefined) payload.slug = generateSlug(data.name);
  if (data.description !== undefined) payload.description = data.description;
  if (data.price !== undefined) payload.price = Number(data.price);
  if (data.categoryId !== undefined) payload.category_id = data.categoryId;
  if (data.images !== undefined) payload.image = data.images[0] || '';

  const updatedDoc = await appwriteDatabaseService.updateDocument<ProductDocument>(
    collectionId,
    id,
    payload
  );

  if (!updatedDoc) {
    return null;
  }

  return mapDocumentToProduct(updatedDoc);
};

export const deleteProduct = async (
  id: string
): Promise<{ imageCleanup: ImageCleanupStatus }> => {
  const collectionId = env.appwrite.tables.products;
  // Capture associated image BEFORE deleting the record.
  const existing = await getProductById(id).catch(() => null);
  const existingImage = existing ? productImageUrls(existing)[0] : undefined;

  // Delete from Appwrite — throw if delete fails so the caller knows it failed.
  await appwriteDatabaseService.deleteDocument(collectionId, id);

  // Remove associated inventory record for the deleted product.
  try {
    await inventoryService.deleteInventoryByProductId(id);
  } catch (err: unknown) {
    console.warn('Failed to clean up inventory for deleted product:', err instanceof Error ? err.message : err);
  }

  // Delete the associated storage file only after the record is gone,
  // and only when no other product references it.
  const imageCleanup = await deleteImageFileIfExclusive(existingImage, id);
  return { imageCleanup };
};

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
