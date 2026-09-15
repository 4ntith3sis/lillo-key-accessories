'use client';

import Link from 'next/link';
import Cursor from '@/components/Cursor';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { formatPrice, parseNumericPrice } from '@/lib/api';
import { cartItemKey, cartItemUnitPrice } from '@/types/cart';

const formatSubtotal = (unitPrice: number, qty: number): string => {
  return formatPrice(unitPrice * qty);
};

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    formattedTotalPrice,
  } = useCart();

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>

      <div className="grain"></div>
      <Cursor />
      <Navbar />

      <main id="content" className="cart-page-main" tabIndex={-1}>
        <div className="cart-page-container">
          {/* Header Banner */}
          <div className="cart-header-section">
            <span className="cart-small-label">PILIHAN ANDA</span>
            <h1 className="cart-main-heading">KERANJANG BELANJA</h1>
            {items.length > 0 && (
              <p className="cart-sub-heading">
                Kamu memiliki {totalItems} item di keranjang belanja.
              </p>
            )}
          </div>

          {items.length === 0 ? (
            /* Empty State */
            <div className="cart-empty-container">
              <div className="empty-icon-circle">🛒</div>
              <h2 className="empty-title">KERANJANG BELANJA KOSONG</h2>
              <p className="empty-sub">
                Jelajahi koleksi gantungan kunci dan aksesoris buatan tangan kami untuk menemukan favoritmu berikutnya.
              </p>
              <Link href="/collection" className="btn btn-primary continue-shopping-btn">
                <span>LANJUTKAN BELANJA</span>
                <span className="btn-sparkle">✦</span>
              </Link>
            </div>
          ) : (
            /* Active Cart Items & Summary */
            <div className="cart-content-grid">
              <div className="cart-items-list">
                {items.map((item) => {
                  const { product, quantity, variant } = item;
                  const key = cartItemKey(item);
                  const unitPrice = cartItemUnitPrice(item);
                  const itemStock = product.stock ?? variant?.stock;
                  const atStockCap = itemStock !== undefined && quantity >= itemStock;
                  return (
                  <article key={key} className="cart-item-card">
                    {/* Product Image */}
                    <div className="cart-item-image-box">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="cart-image-fallback">✦</span>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="cart-item-details">
                      <span className="cart-item-category">{product.category}</span>
                      <h3 className="cart-item-title">
                        <Link href={`/products/${encodeURIComponent(product.id)}`}>{product.name}</Link>
                      </h3>
                      <div className="cart-item-price">{formatPrice(unitPrice)}</div>
                    </div>

                    {/* Quantity Control */}
                    <div className="cart-item-quantity-box">
                      <span className="qty-label">JUMLAH</span>
                      <div className="qty-controls">
                        <button
                          className="qty-btn"
                          aria-label="Decrease quantity"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                        >
                          -
                        </button>
                        <span className="qty-value">{quantity}</span>
                        <button
                          className="qty-btn"
                          aria-label="Increase quantity"
                          disabled={atStockCap}
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      {itemStock !== undefined && (
                        <span className="detail-qty-hint">STOK {itemStock}</span>
                      )}
                    </div>

                    {/* Subtotal */}
                    <div className="cart-item-subtotal-box">
                      <span className="subtotal-label">SUBTOTAL</span>
                      <span className="subtotal-value">{formatSubtotal(unitPrice, quantity)}</span>
                    </div>

                    {/* Remove Action */}
                    <button
                      className="cart-item-remove-btn"
                      aria-label={`Hapus ${product.name} dari keranjang`}
                      onClick={() => removeFromCart(product.id)}
                    >
                      ✕ HAPUS
                    </button>
                  </article>
                  );
                })}

                <div className="cart-actions-row">
                  <button onClick={clearCart} className="btn btn-secondary clear-cart-btn">
                    BERSIHKAN KERANJANG
                  </button>
                  <Link href="/collection" className="btn btn-secondary continue-btn">
                    LANJUTKAN BELANJA
                  </Link>
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <aside className="cart-summary-sidebar">
                <div className="summary-card">
                  <h3 className="summary-title">RINGKASAN PESANAN</h3>
                  <div className="summary-divider"></div>

                  <div className="summary-row">
                    <span>Item ({totalItems})</span>
                    <span>{formattedTotalPrice}</span>
                  </div>

                  <div className="summary-row">
                    <span>Estimasi Pengiriman</span>
                    <span className="free-shipping">GRATIS</span>
                  </div>

                  <div className="summary-divider"></div>

                  <div className="summary-row total-row">
                    <span>ESTIMASI TOTAL</span>
                    <span className="total-price">{formattedTotalPrice}</span>
                  </div>

                  <Link href="/checkout" className="btn btn-primary checkout-btn" style={{ textDecoration: 'none' }}>
                    <span>LANJUTKAN KE PEMBAYARAN</span>
                    <span className="btn-sparkle">✦</span>
                  </Link>

                  <p className="checkout-note">
                    🔒 Pemrosesan pesanan aman. Pengiriman cepat & terpercaya.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
