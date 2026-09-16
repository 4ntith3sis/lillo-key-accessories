'use client';

import { useState } from 'react';
import Link from 'next/link';
import Cursor from '@/components/Cursor';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { getWhatsAppCheckoutUrl, CustomerInfo } from '@/lib/whatsapp';
import {
  formatPrice,
  getProductById,
  getInventoryByProduct,
} from '@/lib/api';
import { cartItemKey, cartItemUnitPrice } from '@/types/cart';

const formatSubtotal = (unitPrice: number, qty: number): string => {
  return formatPrice(unitPrice * qty);
};

export default function CheckoutPage() {
  const { items, totalItems, formattedTotalPrice } = useCart();

  const [formData, setFormData] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your full name.';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Please enter your phone number.';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Please enter your full shipping address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Revalidate every cart line against live backend data (localStorage is
   * persistence only — never the source of truth for price/stock).
   * Returns an error message when checkout must not proceed, else null.
   */
  const validateStock = async (): Promise<string | null> => {
    for (const item of items) {
      if (!item || item.quantity <= 0) {
        return 'Your shopping cart contains an invalid item.';
      }
      let liveProduct;
      try {
        liveProduct = await getProductById(item.product.id);
      } catch {
        return 'Could not verify current stock. Please try again.';
      }
      if (!liveProduct) {
        return `"${item.product.name}" is no longer available. Please remove it from your cart.`;
      }
      try {
        const liveInventory = await getInventoryByProduct(item.product.id);
        const liveStock = liveInventory ? Math.max(0, Math.floor(liveInventory.stock)) : 0;
        if (item.quantity > liveStock) {
          return liveStock <= 0
            ? `"${item.product.name}" is currently out of stock. Please remove it from your cart.`
            : `Some products are no longer available in the requested quantity. Only ${liveStock} pcs of "${item.product.name}" remain — please adjust your cart.`;
        }
      } catch {
        return 'Could not verify current stock. Please try again.';
      }
    }
    return null;
  };

  const checkoutLabel = validating
    ? 'CHECKING STOCK...'
    : submitting
      ? 'OPENING WHATSAPP...'
      : 'PAY VIA WHATSAPP';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || validating) return;
    setConfigError(null);

    if (items.length === 0) return;

    if (!validateForm()) return;

    setValidating(true);
    const stockError = await validateStock();
    setValidating(false);
    if (stockError) {
      setConfigError(stockError);
      return;
    }

    setSubmitting(true);

    const res = getWhatsAppCheckoutUrl(formData, items, formattedTotalPrice);

    if (!res.url || res.error) {
      setConfigError(res.error || 'Failed to create the WhatsApp link.');
      setSubmitting(false);
      return;
    }

    // Open WhatsApp in a new tab. The cart is intentionally NOT cleared:
    // opening WhatsApp does not mean the order was actually sent.
    window.open(res.url, '_blank', 'noopener,noreferrer');

    setTimeout(() => {
      setSubmitting(false);
    }, 1500);
  };

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>

      <div className="grain"></div>
      <Cursor />
      <Navbar />

      <main id="content" className="checkout-page-main" tabIndex={-1}>
        <div className="checkout-page-container">
          <div className="checkout-header-section">
            <span className="checkout-small-label">FINAL STEP</span>
            <h1 className="checkout-main-heading">CHECKOUT</h1>
            {items.length > 0 && (
              <p className="checkout-sub-heading">
                Fill in your details below to place your order directly via WhatsApp.
              </p>
            )}
          </div>

          {items.length === 0 ? (
            /* Empty Cart Protection */
            <div className="checkout-empty-container">
              <div className="empty-icon-circle">🛒</div>
              <h2 className="empty-title">YOUR SHOPPING CART IS EMPTY</h2>
              <p className="empty-sub">
                Please add products to your cart before proceeding to checkout.
              </p>
              <Link href="/collection" className="btn btn-primary continue-shopping-btn">
                <span>BACK TO SHOP</span>
                <span className="btn-sparkle">✦</span>
              </Link>
            </div>
          ) : (
            /* Checkout Form & Order Summary Grid */
            <div className="checkout-content-grid">
              {/* Left Column: Customer Information Form */}
              <div className="checkout-form-column">
                <form onSubmit={handleSubmit} className="customer-info-form" noValidate>
                  <h2 className="form-section-title">CUSTOMER INFORMATION</h2>

                  {configError && (
                    <div className="config-error-alert">
                      <p>⚠️ {configError}</p>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      FULL NAME <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className={`form-input ${errors.name ? 'input-error' : ''}`}
                      placeholder="e.g. Alexandra Chen"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                    {errors.name && <span className="field-error-msg">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      PHONE NUMBER <span className="required-star">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className={`form-input ${errors.phone ? 'input-error' : ''}`}
                      placeholder="e.g. 08123456789"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                    {errors.phone && <span className="field-error-msg">{errors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="address" className="form-label">
                      SHIPPING ADDRESS <span className="required-star">*</span>
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      className={`form-input form-textarea ${errors.address ? 'input-error' : ''}`}
                      placeholder="Street, house number, district, city, postal code"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                    {errors.address && <span className="field-error-msg">{errors.address}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="notes" className="form-label">
                      NOTES <span className="optional-label">(OPTIONAL)</span>
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={2}
                      className="form-input form-textarea"
                      placeholder="Special instructions or delivery notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-submit-desktop">
                    <button
                      type="submit"
                      disabled={submitting || validating}
                      className="btn btn-primary whatsapp-submit-btn"
                    >
                      <span>{checkoutLabel}</span>
                      <span className="btn-sparkle">💬</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Order Summary */}
              <aside className="checkout-summary-column">
                <div className="summary-card">
                  <h3 className="summary-title">ORDER SUMMARY</h3>
                  <div className="summary-divider"></div>

                  {/* Item List */}
                  <div className="summary-items-list">
                    {items.map((item) => {
                      const unitPrice = cartItemUnitPrice(item);
                      const key = cartItemKey(item);
                      return (
                      <div key={key} className="summary-item-row">
                        <div className="summary-item-info">
                          <span className="item-name">{item.product.name}</span>
                          <span className="item-qty">
                            {formatPrice(unitPrice)} × {item.quantity}
                          </span>
                        </div>
                        <span className="item-subtotal">
                          {formatSubtotal(unitPrice, item.quantity)}
                        </span>
                      </div>
                      );
                    })}
                  </div>

                  <div className="summary-divider"></div>

                  <div className="summary-row">
                    <span>Subtotal ({totalItems} item)</span>
                    <span>{formattedTotalPrice}</span>
                  </div>

                  <div className="summary-row">
                    <span>Shipping</span>
                    <span className="free-shipping">FREE</span>
                  </div>

                  <div className="summary-divider"></div>

                  <div className="summary-row total-row">
                    <span>TOTAL</span>
                    <span className="total-price">{formattedTotalPrice}</span>
                  </div>

                  <div className="form-submit-mobile">
                    <button
                      type="button"
                      disabled={submitting || validating}
                      onClick={handleSubmit}
                      className="btn btn-primary whatsapp-submit-btn"
                    >
                      <span>{checkoutLabel}</span>
                      <span className="btn-sparkle">💬</span>
                    </button>
                  </div>

                  <p className="checkout-note">
                    📲 Pressing the pay button will open WhatsApp with your order text pre-filled.
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
