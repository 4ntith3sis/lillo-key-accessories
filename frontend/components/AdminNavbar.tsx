'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const isOverview = pathname === '/admin';
  const isProducts = pathname.startsWith('/admin/products');
  const isCategories = pathname.startsWith('/admin/categories');
  const isInventory = pathname.startsWith('/admin/inventory');
  const isCms = pathname.startsWith('/admin/cms');
  const isHomepage = pathname.startsWith('/admin/homepage');
  const isAbout = pathname.startsWith('/admin/about');

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <header className="admin-header">
      <div className="admin-header-container">
        <div className="admin-brand">
          <Link href="/admin" className="admin-logo">
            LILLO <span className="admin-badge">ADMIN</span>
          </Link>
        </div>

        <span className="admin-menu-label">MENU</span>
        <nav className="admin-nav-links">
          <Link href="/admin" className={`admin-nav-item ${isOverview ? 'active' : ''}`}>
            Overview
          </Link>
          <Link href="/admin/products" className={`admin-nav-item ${isProducts ? 'active' : ''}`}>
            Products
          </Link>
          <Link href="/admin/categories" className={`admin-nav-item ${isCategories ? 'active' : ''}`}>
            Categories
          </Link>
          <Link href="/admin/inventory" className={`admin-nav-item ${isInventory ? 'active' : ''}`}>
            Inventory Stock
          </Link>
          <Link href="/admin/cms" className={`admin-nav-item ${isCms || isHomepage || isAbout ? 'active' : ''}`}>
            CMS Editor
          </Link>
        </nav>

        <div className="admin-header-actions">
          <Link href="/" className="admin-website-btn" target="_blank">
            <span>View Website</span>
            <span className="external-icon">↗</span>
          </Link>
          <button
            onClick={handleLogout}
            className="action-btn delete-btn"
            type="button"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}
