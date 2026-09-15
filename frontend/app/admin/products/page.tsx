'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getProducts, deleteProduct, normalizeProduct, NormalizedProductItem } from '@/lib/api';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<NormalizedProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<NormalizedProductItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cleanupWarning, setCleanupWarning] = useState<string | null>(null);

  const fetchProductsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await getProducts();
      setProducts(raw.map((p) => normalizeProduct(p)));
    } catch (err: unknown) {
      console.warn('Failed to load products list:', err);
      setError('Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsList();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const { imageCleanup } = await deleteProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setFeedback(`Product "${deleteTarget.name}" deleted successfully.`);
      // Never silently report full cleanup: surface storage failures clearly.
      setCleanupWarning(
        imageCleanup === 'failed'
          ? `Product record deleted, but its image file could not be removed from storage.`
          : null
      );
      setTimeout(() => setFeedback(null), 3500);
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="admin-page-wrapper">
        <AdminNavbar />

        <main className="admin-main-content">
          <div className="admin-container">
            <div className="admin-page-header flex-between">
              <div>
                <span className="admin-small-label">CATALOG MANAGEMENT</span>
                <h1 className="admin-page-title">PRODUCTS</h1>
              </div>
              <Link href="/admin/products/new" className="btn btn-primary admin-primary-btn">
                <span>+ ADD PRODUCT</span>
              </Link>
            </div>

            {feedback && (
              <div className="admin-success-alert">
                <span>✓ {feedback}</span>
              </div>
            )}

            {cleanupWarning && (
              <div className="admin-error-box">
                <p>⚠️ {cleanupWarning}</p>
              </div>
            )}

            <div className="admin-filter-bar">
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search product by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="admin-loading-box">
                <p>Loading products list...</p>
              </div>
            ) : error ? (
              <div className="admin-error-box">
                <p>{error}</p>
                <button onClick={fetchProductsList} className="btn btn-secondary">
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="admin-empty-box">
                <p>No products found.</p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>IMAGE</th>
                      <th>NAME</th>
                      <th>CATEGORY</th>
                      <th>PRICE</th>
                      <th style={{ textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((prod) => (
                      <tr key={prod.id}>
                        <td>
                          <div className="admin-thumb-box">
                            {prod.hasImage && prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  const ph = (e.target as HTMLImageElement).parentElement?.querySelector('.admin-thumb-placeholder');
                                  if (ph) (ph as HTMLElement).style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className="admin-thumb-placeholder"
                              style={{ display: prod.hasImage && prod.image ? 'none' : 'flex' }}
                            >
                              <span>✦</span>
                            </div>
                          </div>
                        </td>
                        <td className="font-semibold">{prod.name}</td>
                        <td>
                          <span className="admin-cat-pill">{prod.category}</span>
                        </td>
                        <td className="font-mono">{prod.price}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-actions">
                            <Link href={`/admin/products/${encodeURIComponent(prod.id)}`} className="action-btn edit-btn">
                              EDIT
                            </Link>
                              <button
                                onClick={() => { setDeleteError(null); setDeleteTarget(prod); }}
                                className="action-btn delete-btn"
                              >
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

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-card">
              <h3 className="modal-title">CONFIRM DELETION</h3>
              <p className="modal-text">
                Are you sure you want to delete product <strong>"{deleteTarget.name}"</strong>? This action cannot be undone.
              </p>
              {deleteError && (
                <div className="admin-error-box">
                  <p>⚠️ {deleteError}</p>
                </div>
              )}
              <div className="modal-actions">
                <button
                  disabled={deleting}
                  onClick={() => setDeleteTarget(null)}
                  className="btn btn-secondary"
                >
                  CANCEL
                </button>
                <button
                  disabled={deleting}
                  onClick={confirmDelete}
                  className="btn btn-danger"
                >
                  {deleting ? 'DELETING...' : 'DELETE PRODUCT'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
