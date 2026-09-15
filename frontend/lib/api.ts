import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { Inventory } from '@/types/inventory';

const getApiBaseUrl = () => {
  // 1. BROWSER RUNTIME (Client-side)
  if (typeof window !== 'undefined') {
    // If NEXT_PUBLIC_API_URL is set to an absolute or relative path, use it
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    // Otherwise on production browser, default to empty string (same-origin relative /api/...)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return '';
    }
    return 'http://localhost:4000';
  }

  // 2. NODE.JS RUNTIME (Server-Side Rendering / Serverless SSR)
  // node-fetch on server requires an absolute URL. Relative paths like '/api' will throw an error in Node.js.
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Local SSR fallback to Express development server
  return process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith('http')
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:4000';
};

const API_BASE_URL = getApiBaseUrl();




export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  imageCleanup?: ImageCleanupStatus;
}

export type ImageCleanupStatus =
  | 'deleted'
  | 'shared-skipped'
  | 'no-image'
  | 'not-storage-file'
  | 'failed';

export interface NormalizedProductItem {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  slug?: string;
  price: string;
  image: string;
  hasImage: boolean;
  stock: number;
  inStock: boolean;
}

export const formatPrice = (price: number | string): string => {
  const num = typeof price === 'number' ? price : parseFloat(price);
  if (isNaN(num)) return 'Rp0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
};

/** Parse an IDR-formatted price string (e.g. "Rp 25.000") back to number. */
export const parseNumericPrice = (priceStr: string | number): number => {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  const digits = priceStr.toString().replace(/[^0-9]/g, '');
  const num = parseInt(digits, 10);
  return isNaN(num) ? 0 : num;
};

export const normalizeProduct = (
  product: Product,
  categoryMap?: Map<string, string>,
  inventoryMap?: Map<string, number>
): NormalizedProductItem => {
  const id = product.$id || product.id || 'unknown';
  const name = product.name || 'LILLO Accessory';
  const categoryId = product.categoryId;
  const category =
    (categoryId && categoryMap?.get(categoryId)) ||
    (categoryId && categoryMap?.get(categoryId.toLowerCase())) ||
    product.category ||
    'COLLECTION';
  const slug = product.slug;
  const price = formatPrice(product.price);

  let image = '';
  if (product.images && product.images.length > 0 && product.images[0]) {
    image = product.images[0];
  } else if (product.image) {
    image = product.image;
  }

  const stock = inventoryMap?.has(id)
    ? (inventoryMap.get(id) ?? 0)
    : (typeof product.stock === 'number' ? product.stock : 0);

  return {
    id,
    name,
    category,
    categoryId,
    slug,
    price,
    image,
    hasImage: image.length > 0,
    stock,
    inStock: stock > 0,
  };
};

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
    // Standard fetch without aggressive client caching to keep product data fresh
    cache: 'no-store',
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `API error (${res.status}): ${res.statusText}`);
  }

  const json: ApiResponse<T> = await res.json();
  if (!json.success) {
    throw new Error(json.message || 'API request returned failure');
  }

  return (json.data ?? []) as T;
}

export async function getProducts(): Promise<Product[]> {
  return fetchApi<Product[]>('/api/products');
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json: ApiResponse<Product> = await res.json();
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  return fetchApi<Category[]>('/api/categories');
}

export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json: ApiResponse<Category> = await res.json();
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

/* ==========================================================================
   INVENTORY API CLIENT
   ========================================================================== */
export async function getInventory(): Promise<Inventory[]> {
  return fetchApi<Inventory[]>('/api/inventory');
}

export async function getInventoryByProduct(productId: string): Promise<Inventory | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/inventory/${encodeURIComponent(productId)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json: ApiResponse<Inventory> = await res.json();
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

export async function updateInventory(productId: string, stock: number): Promise<Inventory> {
  const res = await fetch(`${API_BASE_URL}/api/inventory/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ stock }),
  });
  const json: ApiResponse<Inventory> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to update stock');
  }
  return json.data;
}

export async function recordStockMovement(data: {
  productId: string;
  type: 'STOCK_IN' | 'STOCK_OUT';
  quantity: number;
  description: string;
}): Promise<{ inventory: Inventory; transaction: import('@/types/inventory').InventoryTransaction }> {
  const res = await fetch(`${API_BASE_URL}/api/inventory/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const json: ApiResponse<{ inventory: Inventory; transaction: import('@/types/inventory').InventoryTransaction }> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to save stock transaction');
  }
  return json.data;
}

export async function getInventoryTransactions(productId?: string): Promise<import('@/types/inventory').InventoryTransaction[]> {
  const endpoint = productId
    ? `/api/inventory/transactions?productId=${encodeURIComponent(productId)}`
    : '/api/inventory/transactions';
  return fetchApi<import('@/types/inventory').InventoryTransaction[]>(endpoint);
}

export async function deleteProductImage(fileId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/api/product-images/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const json: ApiResponse<null> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to delete image');
  }
  return true;
}

export interface DashboardStats {
  products: number;
  categories: number;
  inventory: number;
  totalStock?: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchApi<DashboardStats>('/api/admin/dashboard');
}

export async function loginAdmin(email: string, password: string) {
  const { login } = await import('@/lib/auth');
  return login(email, password);
}

export async function logoutAdmin(): Promise<boolean> {
  const { logout } = await import('@/lib/auth');
  return logout();
}

export async function getCurrentAdmin() {
  const { getCurrentUser } = await import('@/lib/auth');
  return getCurrentUser();
}

export async function createProduct(data: {
  name: string;
  slug?: string;
  price: number;
  categoryId?: string;
  description?: string;
  image?: string;
}): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const json: ApiResponse<Product> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to create product');
  }
  return json.data;
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    slug?: string;
    price: number;
    categoryId?: string;
    description?: string;
    image?: string;
  }>
): Promise<{ product: Product; imageCleanup?: ImageCleanupStatus }> {
  const res = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const json: ApiResponse<Product> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to update product');
  }
  return { product: json.data, imageCleanup: json.imageCleanup };
}

export async function deleteProduct(id: string): Promise<{ imageCleanup?: ImageCleanupStatus }> {
  const res = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const json: ApiResponse<null> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to delete product');
  }
  return { imageCleanup: json.imageCleanup };
}

export async function uploadProductImage(base64Data: string, filename = 'product.jpg'): Promise<{ fileId: string; url: string }> {
  const res = await fetch(`${API_BASE_URL}/api/product-images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ image: base64Data, filename }),
  });
  const json: ApiResponse<{ fileId: string; url: string }> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to upload image');
  }
  return json.data;
}

export async function createCategory(data: { name: string; slug?: string; description?: string }): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const json: ApiResponse<Category> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to create category');
  }
  return json.data;
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; slug?: string; description?: string }>
): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/api/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const json: ApiResponse<Category> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to update category');
  }
  return json.data;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/api/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const json: ApiResponse<null> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Category is still used by products.');
  }
  return true;
}

export async function getHomepageContent(): Promise<import('@/types/homepage').HomepageContent> {
  const res = await fetch(`${API_BASE_URL}/api/homepage`, {
    cache: 'no-store',
  });
  const json: ApiResponse<import('@/types/homepage').HomepageContent> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    const { DEFAULT_HOMEPAGE_CONTENT } = await import('@/types/homepage');
    return DEFAULT_HOMEPAGE_CONTENT;
  }
  return json.data;
}

export async function updateHomepageContent(
  data: Partial<import('@/types/homepage').HomepageContent>
): Promise<import('@/types/homepage').HomepageContent> {
  const res = await fetch(`${API_BASE_URL}/api/homepage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const json: ApiResponse<import('@/types/homepage').HomepageContent> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to update homepage content');
  }
  return json.data;
}

export async function uploadHomepageAsset(
  fileOrBase64: File | string,
  filename = 'homepage_asset.jpg'
): Promise<{ fileId?: string; url: string; assetUrl: string }> {
  let base64Data = '';
  let name = filename;

  if (typeof fileOrBase64 !== 'string') {
    name = fileOrBase64.name || filename;
    base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBase64);
    });
  } else {
    base64Data = fileOrBase64;
  }

  const res = await fetch(`${API_BASE_URL}/api/homepage/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ image: base64Data, filename: name }),
  });
  const json: ApiResponse<{ fileId?: string; url: string }> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to upload asset');
  }
  const url = json.data.url;
  return { fileId: json.data.fileId, url, assetUrl: url };
}

export async function getAboutContent(): Promise<import('@/types/about').AboutContent> {
  const res = await fetch(`${API_BASE_URL}/api/about`, {
    cache: 'no-store',
  });
  const json: ApiResponse<import('@/types/about').AboutContent> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    const { DEFAULT_ABOUT_CONTENT } = await import('@/types/about');
    return DEFAULT_ABOUT_CONTENT;
  }
  return json.data;
}

export async function updateAboutContent(
  data: Partial<import('@/types/about').AboutContent>
): Promise<import('@/types/about').AboutContent> {
  const res = await fetch(`${API_BASE_URL}/api/about`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const json: ApiResponse<import('@/types/about').AboutContent> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to update about page content');
  }
  return json.data;
}

export async function uploadAboutAsset(
  fileOrBase64: File | string,
  filename = 'about_asset.jpg'
): Promise<{ fileId?: string; url: string; assetUrl: string }> {
  let base64Data = '';
  let name = filename;

  if (typeof fileOrBase64 !== 'string') {
    name = fileOrBase64.name || filename;
    base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBase64);
    });
  } else {
    base64Data = fileOrBase64;
  }

  const res = await fetch(`${API_BASE_URL}/api/about/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ image: base64Data, filename: name }),
  });
  const json: ApiResponse<{ fileId?: string; url: string }> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to upload asset');
  }
  const url = json.data.url;
  return { fileId: json.data.fileId, url, assetUrl: url };
}

export async function uploadCmsImage(
  fileOrBase64: File | string,
  filename = 'cms_asset.jpg'
): Promise<{ fileId: string; url: string }> {
  let base64Data = '';
  let name = filename;

  if (typeof fileOrBase64 !== 'string') {
    name = fileOrBase64.name || filename;
    base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBase64);
    });
  } else {
    base64Data = fileOrBase64;
  }

  const res = await fetch(`${API_BASE_URL}/api/cms/images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ image: base64Data, filename: name }),
  });
  const json: ApiResponse<{ fileId: string; url: string }> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || 'Failed to upload CMS image');
  }
  return json.data;
}

export async function deleteCmsImage(fileId: string): Promise<boolean> {
  if (!fileId) return true;
  const res = await fetch(`${API_BASE_URL}/api/cms/images/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const json: ApiResponse<null> = await res.json();
  return res.ok && json.success;
}

export async function updateHomepageSection(
  section: string,
  data: unknown
): Promise<import('@/types/homepage').HomepageContent> {
  const res = await fetch(`${API_BASE_URL}/api/cms/homepage/${encodeURIComponent(section)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const json: ApiResponse<import('@/types/homepage').HomepageContent> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || `Failed to update homepage section ${section}`);
  }
  return json.data;
}

export async function updateAboutSection(
  section: string,
  data: unknown
): Promise<import('@/types/about').AboutContent> {
  const res = await fetch(`${API_BASE_URL}/api/cms/about/${encodeURIComponent(section)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const json: ApiResponse<import('@/types/about').AboutContent> = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.message || `Failed to update about section ${section}`);
  }
  return json.data;
}

export const getHomepageCms = getHomepageContent;
export const getAboutCms = getAboutContent;



