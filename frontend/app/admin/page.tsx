'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/AdminNavbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getDashboardStats, DashboardStats } from '@/lib/api';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviewData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err: unknown) {
      console.warn('Failed to fetch admin overview counts:', err);
      setError('Unable to load overview metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  return (
    <ProtectedRoute>
      <div className="admin-page-wrapper">
        <AdminNavbar />

        <main className="admin-main-content">
          <div className="admin-container">
            <div className="admin-page-header">
              <div>
                <span className="admin-small-label">DASHBOARD OVERVIEW</span>
                <h1 className="admin-page-title">SYSTEM METRICS</h1>
              </div>
            </div>

            {error ? (
              <div className="admin-error-box">
                <p>{error}</p>
                <button onClick={fetchOverviewData} className="btn btn-secondary">
                  Retry
                </button>
              </div>
            ) : (
              <div className="admin-metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">PRODUCTS</span>
                    <span className="metric-icon">📦</span>
                  </div>
                  <div className="metric-value">{loading ? '...' : stats?.products}</div>
                  <p className="metric-desc">Active items in catalog</p>
                  <Link href="/admin/products" className="metric-link">
                    Manage Products →
                  </Link>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">CATEGORIES</span>
                    <span className="metric-icon">🏷️</span>
                  </div>
                  <div className="metric-value">{loading ? '...' : stats?.categories}</div>
                  <p className="metric-desc">Configured item categories</p>
                  <Link href="/admin/categories" className="metric-link">
                    Manage Categories →
                  </Link>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">INVENTORY</span>
                    <span className="metric-icon">📊</span>
                  </div>
                  <div className="metric-value">{loading ? '...' : stats?.inventory}</div>
                  <p className="metric-desc">Configured product stocks</p>
                  <Link href="/admin/inventory" className="metric-link">
                    Manage Inventory →
                  </Link>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">TOTAL UNITS</span>
                    <span className="metric-icon">📦</span>
                  </div>
                  <div className="metric-value">{loading ? '...' : stats?.totalStock ?? 0}</div>
                  <p className="metric-desc">Total items in physical stock</p>
                  <Link href="/admin/inventory" className="metric-link">
                    View Stock Details →
                  </Link>
                </div>
              </div>
            )}

            <div className="admin-quick-actions-section">
              <h3 className="section-title">QUICK ACTIONS</h3>
              <div className="quick-actions-grid">
                <Link href="/admin/inventory" className="quick-action-card">
                  <span className="action-icon">📊</span>
                  <span className="action-text">Manage Stock Inventory</span>
                </Link>
                <Link href="/admin/homepage" className="quick-action-card">
                  <span className="action-icon">🖥️</span>
                  <span className="action-text">Manage Homepage CMS</span>
                </Link>
                <Link href="/admin/about" className="quick-action-card">
                  <span className="action-icon">📖</span>
                  <span className="action-text">Manage About CMS</span>
                </Link>
                <Link href="/admin/products/new" className="quick-action-card">
                  <span className="action-icon">➕</span>
                  <span className="action-text">Add New Product</span>
                </Link>
                <Link href="/admin/products" className="quick-action-card">
                  <span className="action-icon">📝</span>
                  <span className="action-text">Edit Existing Products</span>
                </Link>
                <Link href="/admin/categories" className="quick-action-card">
                  <span className="action-icon">🏷️</span>
                  <span className="action-text">Manage Categories</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
