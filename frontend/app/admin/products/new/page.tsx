'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getCategories, createProduct, uploadProductImage } from '@/lib/api';
import { Category } from '@/types/category';

export default function AdminNewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
        if (cats.length > 0) {
          setCategoryId(cats[0].$id || cats[0].slug);
        }
      } catch (err: unknown) {
        console.warn('Failed to load categories:', err);
        setError('Unable to load categories. Please refresh and try again.');
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCats();
  }, []);

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
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }
    const finalSlug = slugTouched && slug.trim()
      ? slug.trim().toLowerCase()
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(finalSlug)) {
      setError('Slug must be lowercase alphanumeric with hyphens.');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Please enter a valid non-negative price.');
      return;
    }
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = '';

      // If a new base64 image was selected, it must upload successfully —
      // never create a half-complete product record on upload failure.
      if (imagePreview && imagePreview.startsWith('data:image/')) {
        try {
          const uploaded = await uploadProductImage(imagePreview, imageFile?.name || 'product.jpg');
          if (uploaded?.url) {
            finalImageUrl = uploaded.url;
          } else {
            throw new Error('Image upload returned no URL.');
          }
        } catch (uploadErr: any) {
          setError(uploadErr?.message || 'Failed to upload image. Product was not created.');
          setSaving(false);
          return;
        }
      }

      await createProduct({
        name: name.trim(),
        slug: finalSlug,
        price: numPrice,
        categoryId,
        description: description.trim(),
        image: finalImageUrl,
      });

      setSuccess('Product created successfully!');
      setTimeout(() => {
        router.push('/admin/products');
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to create product.');
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
                ADD NEW PRODUCT
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

            <form onSubmit={handleSubmit} className="admin-form-card" noValidate>
              <div className="form-group">
                <label htmlFor="prod-name" className="form-label">
                  PRODUCT NAME <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  id="prod-name"
                  className="form-input"
                  placeholder="e.g. Drishti Bomma"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched) {
                      setSlug(
                        e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                      );
                    }
                  }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="prod-slug" className="form-label">
                  SLUG <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  id="prod-slug"
                  className="form-input"
                  placeholder="e.g. drishti-bomma"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase());
                    setSlugTouched(true);
                  }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="prod-cat" className="form-label">
                  CATEGORY <span className="required-star">*</span>
                </label>
                {loadingCategories ? (
                  <div className="form-input" style={{ opacity: 0.7 }}>Loading categories...</div>
                ) : (
                  <select
                    id="prod-cat"
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
                )}
              </div>

              <div className="form-group">
                <label htmlFor="prod-price" className="form-label">
                  PRICE (NUMERIC) <span className="required-star">*</span>
                </label>
                <input
                  type="number"
                  id="prod-price"
                  className="form-input"
                  placeholder="e.g. 28.00"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="prod-desc" className="form-label">
                  DESCRIPTION
                </label>
                <textarea
                  id="prod-desc"
                  className="form-input form-textarea"
                  rows={3}
                  placeholder="Small charm made to add a little personality..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="prod-img" className="form-label">
                  PRODUCT IMAGE
                </label>
                <input
                  type="file"
                  id="prod-img"
                  accept="image/*"
                  className="form-input form-file-input"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="admin-image-preview-container">
                    <span className="preview-label">IMAGE PREVIEW:</span>
                    <div className="preview-box">
                      <img src={imagePreview} alt="Preview" />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-actions-bar">
                <Link href="/admin/products" className="btn btn-secondary">
                  CANCEL
                </Link>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'SAVING PRODUCT...' : 'SAVE PRODUCT'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
