'use client';

import { Suspense, useEffect, useState, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Cursor from '@/components/Cursor';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import CategorySidebar from '@/components/CategorySidebar';
import { getProducts, getCategories, getInventory, normalizeProduct, NormalizedProductItem } from '@/lib/api';
import { Category } from '@/types/category';

function CollectionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const currentCategoryQuery = searchParams.get('category') || 'all';

  const [products, setProducts] = useState<NormalizedProductItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollectionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rawProducts, rawCategories, inventoryList] = await Promise.all([
        getProducts(),
        getCategories(),
        getInventory().catch(() => []),
      ]);

      const categoryMap = new Map(
        rawCategories.map((c) => [(c.$id || '').toLowerCase(), c.name])
      );
      const inventoryMap = new Map(
        inventoryList.map((inv) => [inv.productId, inv.stock])
      );
      const normalizedProds = rawProducts.map((p) => normalizeProduct(p, categoryMap, inventoryMap));
      setProducts(normalizedProds);
      setCategories(rawCategories);
    } catch (err: unknown) {
      console.warn('Failed to load collection data:', err);
      setError('Failed to load the collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectionData();
  }, []);

  const handleCategorySelect = (categorySlugOrId: string) => {
    startTransition(() => {
      if (categorySlugOrId === 'all') {
        router.push('/collection', { scroll: false });
      } else {
        router.push(`/collection?category=${encodeURIComponent(categorySlugOrId)}`, { scroll: false });
      }
    });
  };

  // Compute category counts for sidebar
  const productCounts: Record<string, number> = {
    all: products.length,
  };

  products.forEach((p) => {
    const catNameUpper = (p.category || 'COLLECTION').toUpperCase();
    productCounts[catNameUpper] = (productCounts[catNameUpper] || 0) + 1;
    if (p.categoryId) {
      productCounts[p.categoryId] = (productCounts[p.categoryId] || 0) + 1;
    }
  });

  // Filter products based on selected category
  const filteredProducts = products.filter((p) => {
    if (currentCategoryQuery === 'all') return true;
    const qLower = currentCategoryQuery.toLowerCase();
    
    // Check direct category ID or category name/slug match
    if (p.categoryId && p.categoryId.toLowerCase() === qLower) return true;
    if (p.slug && p.slug.toLowerCase() === qLower) return true;
    if (p.category && p.category.toLowerCase() === qLower) return true;

    // Check matching against category objects list
    const matchedCategoryObj = categories.find(
      (c) => c.slug?.toLowerCase() === qLower || c.$id?.toLowerCase() === qLower || c.name.toLowerCase() === qLower
    );

    if (matchedCategoryObj) {
      if (p.categoryId === matchedCategoryObj.$id) return true;
      if (p.category.toLowerCase() === matchedCategoryObj.name.toLowerCase()) return true;
    }

    return false;
  });

  const activeCategoryName = currentCategoryQuery === 'all'
    ? 'ALL PRODUCTS'
    : categories.find((c) => c.slug === currentCategoryQuery || c.$id === currentCategoryQuery)?.name.toUpperCase() || currentCategoryQuery.toUpperCase();

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>

      <div className="grain"></div>
      <Cursor />
      <Navbar />

      <main id="content" className="collection-page-main" tabIndex={-1}>
        <section className="collection-hero-banner">
          <div className="collection-banner-container">
            <span className="collection-small-label">CATALOG & ARCHIVE</span>
            <h1 className="collection-main-heading">COLLECTION</h1>
            <p className="collection-sub-heading">
              Explore handmade keychains and accessories designed to complement your everyday essentials.
            </p>
          </div>
        </section>

        <section className="collection-grid-section">
          <div className="collection-container">
            <CategorySidebar
              categories={categories}
              selectedCategory={currentCategoryQuery}
              onSelectCategory={handleCategorySelect}
              productCounts={productCounts}
            />

            <div className="collection-products-area">
              <div className="collection-meta-bar">
                <span className="active-category-label">{activeCategoryName}</span>
                <span className="product-count-badge">
                  {loading ? 'LOADING...' : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'PRODUCT' : 'PRODUCTS'}`}
                </span>
              </div>

              {loading ? (
                <div className="product-cards-grid" style={{ opacity: 0.7 }}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <article key={i} className="lillo-product-card" style={{ pointerEvents: 'none' }}>
                      <div className="card-image-box" style={{ background: 'radial-gradient(circle, #FAF8F5 0%, #EFECE6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Loading...</span>
                      </div>
                      <div className="card-info-box">
                        <span className="card-category">...</span>
                        <h3 className="card-title">Loading Product</h3>
                        <div className="card-price">--.--</div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : error ? (
                <div className="collection-error-box">
                  <p className="error-message">{error}</p>
                  <button onClick={fetchCollectionData} className="btn btn-secondary retry-btn">
                    Try Again
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="collection-empty-box">
                  <p className="empty-message">No products found in this collection.</p>
                </div>
              ) : (
                <div className="product-cards-grid">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      actionLabel="VIEW DETAILS"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default function CollectionPage() {
  return (
    <Suspense fallback={<div style={{ background: '#F8F6F0', minHeight: '100vh' }}></div>}>
      <CollectionContent />
    </Suspense>
  );
}
