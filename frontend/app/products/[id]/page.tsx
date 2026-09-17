'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Cursor from '@/components/Cursor';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  getProductById,
  getCategories,
  getInventoryByProduct,
  normalizeProduct,
  NormalizedProductItem,
} from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types/product';
import { Inventory } from '@/types/inventory';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const { addToCart } = useCart();

  const [rawProduct, setRawProduct] = useState<Product | null>(null);
  const [product, setProduct] = useState<NormalizedProductItem | null>(null);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [addedToCartToast, setAddedToCartToast] = useState(false);
  const [detailQty, setDetailQty] = useState(1);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const [data, categories, inv] = await Promise.all([
        getProductById(productId),
        getCategories().catch(() => []),
        getInventoryByProduct(productId).catch(() => null),
      ]);
      if (!data) {
        setNotFound(true);
      } else {
        const categoryMap = new Map(
          categories.map((c) => [(c.$id || '').toLowerCase(), c.name])
        );
        const invStock = inv ? inv.stock : 0;
        const invMap = new Map([[data.$id || data.id || productId, invStock]]);

        setRawProduct(data);
        setInventory(inv);
        setProduct(normalizeProduct(data, categoryMap, invMap));
        setDetailQty(1);
      }
    } catch (err: unknown) {
      console.warn(`Failed to fetch product ${productId}:`, err);
      setError('Failed to load this product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const stock = inventory ? Math.max(0, Math.floor(inventory.stock)) : (product?.stock ?? 0);
  const isOutOfStock = stock <= 0;
  const addDisabled = isOutOfStock;

  const clampDetailQty = (qty: number): number => {
    const clean = Number.isFinite(qty) ? Math.floor(qty) : 1;
    const atLeastOne = Math.max(1, clean);
    if (stock > 0) {
      return Math.min(atLeastOne, stock);
    }
    return atLeastOne;
  };

  const handleAddToCart = () => {
    if (!product || addDisabled) return;
    const qty = clampDetailQty(detailQty);
    addToCart(product, qty);
    setAddedToCartToast(true);
    setTimeout(() => {
      setAddedToCartToast(false);
    }, 3000);
  };

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>

      <div className="grain"></div>
      <Cursor />
      <Navbar />

      <main id="content" className="product-detail-main" tabIndex={-1}>
        <div className="product-detail-container">
          <div className="detail-breadcrumb">
            <Link href="/collection" className="back-link">
              ← BACK TO COLLECTION
            </Link>
          </div>

          {loading ? (
            <div className="product-detail-layout loading-skeleton">
              <div className="detail-image-column">
                <div className="product-detail-image-box skeleton-box">
                  <span>Loading Product Image...</span>
                </div>
              </div>
              <div className="detail-info-column">
                <div className="skeleton-line short"></div>
                <div className="skeleton-line title"></div>
                <div className="skeleton-line price"></div>
                <div className="skeleton-line desc"></div>
                <div className="skeleton-line desc"></div>
              </div>
            </div>
          ) : notFound ? (
            <div className="product-detail-not-found">
              <h2>PRODUCT NOT FOUND</h2>
              <p>The product you are looking for does not exist or has been removed.</p>
              <Link href="/collection" className="btn btn-secondary">
                BACK TO SHOP
              </Link>
            </div>
          ) : error ? (
            <div className="product-detail-error">
              <p className="error-text">{error}</p>
              <button onClick={fetchProduct} className="btn btn-secondary">
                TRY AGAIN
              </button>
            </div>
          ) : product ? (
            <div className="product-detail-layout">
              {/* Left Column: Product Image */}
              <div className="detail-image-column">
                <div className="product-detail-image-box">
                  <span className="detail-category-badge">{product.category}</span>
                  {product.hasImage && product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const ph = (e.target as HTMLImageElement).parentElement?.querySelector('.card-image-placeholder');
                        if (ph) (ph as HTMLElement).style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="card-image-placeholder"
                    style={{ display: product.hasImage && product.image ? 'none' : 'flex' }}
                  >
                    <span>IMAGE COMING SOON</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Product Information */}
              <div className="detail-info-column">
                <span className="detail-small-category">{product.category}</span>
                <h1 className="detail-product-title">{product.name}</h1>
                <div className="detail-product-price">{product.price}</div>

                <div className="detail-divider"></div>

                {/* Stock Status Banner */}
                <div className="detail-stock-section" style={{ marginBottom: '20px' }}>
                  <div className={`detail-stock-badge ${isOutOfStock ? 'out' : 'in'}`}>
                    <span className="stock-dot" aria-hidden="true" />
                    <span>{isOutOfStock ? 'OUT OF STOCK' : `STOCK: ${stock} UNITS AVAILABLE`}</span>
                  </div>
                </div>

                <div className="detail-description-section">
                  <h3 className="detail-section-title">DESCRIPTION</h3>
                  <p className="detail-description-text">
                    {rawProduct?.description ||
                      `Handmade ${product.name} keychain & charm designed to add a unique touch of character and positive energy to your everyday carry. Durable finish with precise metalwork.`}
                  </p>
                </div>

                {/* Material section */}
                <div className="detail-material-section">
                  <h3 className="detail-section-title">MATERIAL & CRAFTSMANSHIP</h3>
                  <p className="detail-material-text">
                    High-quality resin enamel, 925 silver-plated clamp ring, & handmade braided cord.
                  </p>
                </div>

                <div className="detail-divider"></div>

                {/* Quantity + Add to Cart CTA */}
                <div className="detail-action-box">
                  {!addDisabled && (
                    <div className="detail-qty-row">
                      <span className="qty-label">QTY</span>
                      <div className="qty-controls">
                        <button
                          type="button"
                          className="qty-btn"
                          aria-label="Decrease quantity"
                          onClick={() => setDetailQty((q) => clampDetailQty(q - 1))}
                        >
                          -
                        </button>
                        <span className="qty-value">{clampDetailQty(detailQty)}</span>
                        <button
                          type="button"
                          className="qty-btn"
                          aria-label="Increase quantity"
                          onClick={() => setDetailQty((q) => clampDetailQty(q + 1))}
                        >
                          +
                        </button>
                      </div>
                      <span className="detail-qty-hint">MAX {stock}</span>
                    </div>
                  )}
                  <button
                    onClick={handleAddToCart}
                    disabled={addDisabled}
                    className={`btn btn-primary add-to-cart-btn ${addedToCartToast ? 'added' : ''}`}
                    style={{ transition: 'all 0.3s ease' }}
                  >
                    <span>
                      {addedToCartToast
                        ? 'ADDED ✓'
                        : isOutOfStock
                          ? 'OUT OF STOCK'
                          : 'ADD TO CART'}
                    </span>
                    <span className="btn-sparkle">✦</span>
                  </button>

                  {addedToCartToast && (
                    <div className="toast-notification">
                      <span>✓ Successfully added {product.name} to cart!</span>
                    </div>
                  )}
                </div>

                {/* Craftsmanship & Guarantee Badges */}
                <div className="detail-features-grid">
                  <div className="detail-feature-item">
                    <span className="feature-icon">🚚</span>
                    <span className="feature-text">Free Shipping Min. 2 Pcs</span>
                  </div>
                  <div className="detail-feature-item">
                    <span className="feature-icon">✨</span>
                    <span className="feature-text">Enamel Resin Finish & Silver</span>
                  </div>
                  <div className="detail-feature-item">
                    <span className="feature-icon">🎁</span>
                    <span className="feature-text">Gift Box & Original Card</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </>
  );
}
