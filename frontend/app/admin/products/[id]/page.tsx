'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getProductById, getCategories, updateProduct, uploadProductImage, deleteProductImage, normalizeProduct } from '@/lib/api';
import { Category } from '@/types/category';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminEditProductPage({ params }: EditProductPageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadProductAndCategories = async () => {
    setLoadingData(true);
    setLoadError(null);
    try {
      const [rawProd, cats] = await Promise.all([
        getProductById(productId),
        getCategories(),
      ]);

      setCategories(cats);

      if (!rawProd) {
        setLoadError('Product not found.');
        return;
      }

      const normalized = normalizeProduct(rawProd);
      setName(rawProd.name);
      setSlug(rawProd.slug || '');
      setPrice(rawProd.price ? rawProd.price.toString() : '');
      setDescription(rawProd.description || '');
      setCategoryId(rawProd.categoryId || (cats.length > 0 ? cats[0].$id : ''));
      setCurrentImageUrl(normalized.image);
    } catch (err: unknown) {
      console.warn(`Failed to fetch product ${productId}:`, err);
      setLoadError('Unable to load product data.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadProductAndCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (PNG, JPG, WEBP).');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const extractAppwriteFileId = (url: string): string | null => {
    if (!url) return null;
    const match = /\/files\/([^/?#]+)/.exec(url);
    return match ? match[1] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }
    const finalSlug = slug.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(finalSlug)) {
      setError('Slug must be lowercase alphanumeric with hyphens.');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Please enter a valid non-negative price.');
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = currentImageUrl;
      let freshUploadFileId: string | null = null;

      if (newImagePreview && newImagePreview.startsWith('data:image/')) {
        try {
          const uploaded = await uploadProductImage(newImagePreview, imageFile?.name || 'product.jpg');
          if (!uploaded?.url) {
            throw new Error('Image upload returned no URL.');
          }
          finalImageUrl = uploaded.url;
          freshUploadFileId = extractAppwriteFileId(uploaded.url);
        } catch (uploadErr: any) {
          setError(uploadErr?.message || 'Failed to upload image. Product was not updated.');
          setSaving(false);
          return;
        }
      }

      let imageCleanup: string | undefined;
      try {
        const result = await updateProduct(productId, {
          name: name.trim(),
          slug: finalSlug,
          price: numPrice,
          categoryId,
          description: description.trim(),
          image: finalImageUrl,
        });
        imageCleanup = result.imageCleanup;
      } catch (updateErr: any) {
        if (freshUploadFileId) {
          await deleteProductImage(freshUploadFileId).catch(() => undefined);
        }
        throw updateErr;
      }

      setSuccess(
        imageCleanup === 'failed'
          ? 'Product updated successfully, but the old image file could not be removed from storage.'
          : 'Product updated successfully!'
      );
      setTimeout(() => {
        router.push('/admin/products');
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to update product.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl && !newImagePreview) return;
    if (!confirm('Remove the product image? The file will be deleted from storage.')) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const result = await updateProduct(productId, { image: '' });
      setCurrentImageUrl('');
      setNewImagePreview('');
      setImageFile(null);
      setSuccess(
        result.imageCleanup === 'failed'
          ? 'Image reference removed, but the old file could not be deleted from storage.'
          : 'Product image removed.'
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to remove image.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="admin-page-wrapper">
        <AdminNavbar />

        <main className="admin-main-content">
          <div className="admin-container max-w-700">
            <div className="admin-page-header">
              <Link href="/admin/products" className="back-link">
                ← BACK TO PRODUCTS
              </Link>
              <h1 className="admin-page-title" style={{ marginTop: '8px' }}>
                EDIT PRODUCT
              </h1>
            </div>

            {error && (
              <div className="admin-error-box" style={{ marginBottom: '20px' }}>
                <p>⚠️ {error}</p>
              </div>
            )}

            {success && (
              <div className="admin-success-alert" style={{ marginBottom: '20px' }}>
                <span>✓ {success}</span>
              </div>
            )}

            {loadingData ? (
              <div className="admin-loading-box">
                <p>Loading product details...</p>
              </div>
            ) : loadError ? (
              <div className="admin-error-box">
                <p>{loadError}</p>
                <button onClick={loadProductAndCategories} className="btn btn-secondary">
                  Retry
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="admin-form-card" noValidate>
                  <div className="form-group">
                    <label htmlFor="edit-name" className="form-label">
                      PRODUCT NAME <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="edit-name"
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-slug" className="form-label">
                      SLUG <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="edit-slug"
                      className="form-input"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-cat" className="form-label">
                      CATEGORY <span className="required-star">*</span>
                    </label>
                    <select
                      id="edit-cat"
                      className="form-input form-select"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      {categories.map((cat) => (
                        <option key={cat.$id || cat.slug} value={cat.$id || cat.slug}>
                          {cat.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-price" className="form-label">
                      PRICE (NUMERIC) <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      id="edit-price"
                      className="form-input"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-desc" className="form-label">
                      DESCRIPTION
                    </label>
                    <textarea
                      id="edit-desc"
                      className="form-input form-textarea"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-img" className="form-label">
                      PRODUCT IMAGE
                    </label>
                    <input
                      type="file"
                      id="edit-img"
                      accept="image/*"
                      className="form-input form-file-input"
                      onChange={handleImageChange}
                    />

                    <div className="admin-image-preview-container">
                      <span className="preview-label">CURRENT / NEW IMAGE PREVIEW:</span>
                      <div className="preview-box">
                        {newImagePreview || currentImageUrl ? (
                          <img src={newImagePreview || currentImageUrl} alt="Product preview" />
                        ) : (
                          <span className="preview-box-empty">NO IMAGE</span>
                        )}
                      </div>
                      {(newImagePreview || currentImageUrl) && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={handleRemoveImage}
                          className="action-btn delete-btn"
                          style={{ marginTop: '10px' }}
                        >
                          REMOVE IMAGE
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="form-actions-bar">
                    <Link href="/admin/products" className="btn btn-secondary">
                      CANCEL
                    </Link>
                    <button type="submit" disabled={saving} className="btn btn-primary">
                      {saving ? 'SAVING CHANGES...' : 'SAVE CHANGES'}
                    </button>
                  </div>
                </form>

                <div className="admin-form-card" style={{ marginTop: '24px' }}>
                  <h3 className="section-title">INVENTORY & STOCK</h3>
                  <p style={{ color: '#5C5C5C', fontSize: '0.88rem', marginBottom: '16px' }}>
                    Stock level is managed directly in the Inventory module.
                  </p>
                  <Link href="/admin/inventory" className="btn btn-secondary">
                    MANAGE INVENTORY STOCK →
                  </Link>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
