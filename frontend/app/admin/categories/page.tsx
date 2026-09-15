'use client';

import { useEffect, useState } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/api';
import { Category } from '@/types/category';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Protection error message
  const [protectionWarning, setProtectionWarning] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchCategoriesList = async () => {
    setLoading(true);
    setError(null);
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (err: unknown) {
      console.warn('Failed to load categories:', err);
      setError('Unable to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesList();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDescription('');
    setProtectionWarning(null);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDescription(cat.description || '');
    setProtectionWarning(null);
    setModalError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setModalError('Category Name is required.');
      return;
    }

    setSaving(true);
    setModalError(null);
    setProtectionWarning(null);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.$id, {
          name: catName.trim(),
          description: catDescription.trim(),
        });
        setFeedback(`Category "${catName.trim()}" updated successfully.`);
      } else {
        await createCategory({
          name: catName.trim(),
          description: catDescription.trim(),
        });
        setFeedback(`Category "${catName.trim()}" created successfully.`);
      }

      setTimeout(() => setFeedback(null), 3500);
      setModalOpen(false);
      fetchCategoriesList();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    setProtectionWarning(null);
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    try {
      await deleteCategory(cat.$id);
      setCategories((prev) => prev.filter((c) => c.$id !== cat.$id));
      setFeedback(`Category "${cat.name}" deleted successfully.`);
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setProtectionWarning(err?.message || 'THIS CATEGORY IS CURRENTLY USED BY PRODUCTS.');
    }
  };

  return (
    <ProtectedRoute>
      <div className="admin-page-wrapper">
        <AdminNavbar />

        <main className="admin-main-content">
          <div className="admin-container">
            <div className="admin-page-header flex-between">
              <div>
                <span className="admin-small-label">TAXONOMY MANAGEMENT</span>
                <h1 className="admin-page-title">CATEGORIES</h1>
              </div>
              <button onClick={openAddModal} className="btn btn-primary admin-primary-btn">
                + ADD CATEGORY
              </button>
            </div>

            {feedback && (
              <div className="admin-success-alert">
                <span>✓ {feedback}</span>
              </div>
            )}

            {protectionWarning && (
              <div className="admin-error-box" style={{ marginBottom: '20px' }}>
                <p>⚠️ {protectionWarning}</p>
              </div>
            )}

            {loading ? (
              <div className="admin-loading-box">
                <p>Loading categories list...</p>
              </div>
            ) : error ? (
              <div className="admin-error-box">
                <p>{error}</p>
                <button onClick={fetchCategoriesList} className="btn btn-secondary">
                  Retry
                </button>
              </div>
            ) : categories.length === 0 ? (
              <div className="admin-empty-box">
                <p>No categories found.</p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>SLUG</th>
                      <th>DESCRIPTION</th>
                      <th style={{ textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat.$id || cat.slug}>
                        <td className="font-semibold">{cat.name.toUpperCase()}</td>
                        <td className="font-mono text-dim">{cat.slug}</td>
                        <td className="text-dim">{cat.description || '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-actions">
                            <button onClick={() => openEditModal(cat)} className="action-btn edit-btn">
                              EDIT
                            </button>
                            <button onClick={() => handleDelete(cat)} className="action-btn delete-btn">
                              DELETE
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* Add / Edit Category Modal */}
        {modalOpen && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-card max-w-500">
              <h3 className="modal-title">
                {editingCategory ? 'EDIT CATEGORY' : 'ADD NEW CATEGORY'}
              </h3>
              {modalError && (
                <div className="admin-error-box" style={{ marginTop: '16px' }}>
                  <p>⚠️ {modalError}</p>
                </div>
              )}
              <form onSubmit={handleSave} noValidate style={{ marginTop: '20px' }}>
                <div className="form-group">
                  <label htmlFor="cat-modal-name" className="form-label">
                    CATEGORY NAME <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="cat-modal-name"
                    className="form-input"
                    placeholder="e.g. CHARMS"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cat-modal-desc" className="form-label">
                    DESCRIPTION
                  </label>
                  <textarea
                    id="cat-modal-desc"
                    className="form-input form-textarea"
                    rows={3}
                    placeholder="Category description..."
                    value={catDescription}
                    onChange={(e) => setCatDescription(e.target.value)}
                  />
                </div>

                <div className="modal-actions" style={{ marginTop: '24px' }}>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    CANCEL
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving ? 'SAVING...' : editingCategory ? 'UPDATE CATEGORY' : 'CREATE CATEGORY'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
