'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { NormalizedProductItem, formatPrice } from '@/lib/api';
import { CartItem, CartItemVariant, CartContextType, cartItemKey, cartLineKey, cartItemUnitPrice } from '@/types/cart';

const LOCAL_STORAGE_KEY = 'lillo-cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

const sanitizeQty = (qty: unknown): number => {
  const n = typeof qty === 'number' ? qty : parseInt(String(qty), 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
};

const sanitizeVariant = (v: unknown): CartItemVariant | undefined => {
  if (!v || typeof v !== 'object') return undefined;
  const obj = v as Record<string, unknown>;
  const variant: CartItemVariant = {};
  if (typeof obj.variantId === 'string') variant.variantId = obj.variantId;
  if (typeof obj.colorId === 'string') variant.colorId = obj.colorId;
  if (typeof obj.colorName === 'string') variant.colorName = obj.colorName;
  if (typeof obj.colorHex === 'string') variant.colorHex = obj.colorHex;
  if (typeof obj.sku === 'string') variant.sku = obj.sku;
  if (obj.price !== undefined) {
    const p = Number(obj.price);
    if (Number.isFinite(p) && p >= 0) variant.price = p;
  }
  if (obj.stock !== undefined) {
    const s = Number(obj.stock);
    if (Number.isFinite(s) && s >= 0) variant.stock = Math.floor(s);
  }
  return Object.keys(variant).length > 0 ? variant : undefined;
};

const clampToStock = (qty: number, stock?: number): number => {
  if (stock === undefined) return qty;
  return Math.min(qty, Math.max(0, stock));
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on client mount (SSR Safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Validate structure of stored cart items (supports legacy product-only shape)
          const validItems: CartItem[] = [];
          for (const entry of parsed) {
            if (!entry || typeof entry !== 'object') continue;
            const rec = entry as Record<string, unknown>;
            const prod = rec.product as Record<string, unknown> | undefined;
            if (!prod || typeof prod.id !== 'string' || !prod.id) continue;
            const qty = sanitizeQty(rec.quantity);
            if (qty <= 0) continue;
            const variant = sanitizeVariant(rec.variant);
            validItems.push({
              product: prod as unknown as NormalizedProductItem,
              quantity: clampToStock(qty, (prod as unknown as NormalizedProductItem).stock),
              ...(variant ? { variant } : {}),
            });
          }
          setItems(validItems.filter((i) => i.quantity > 0));
        }
      }
    } catch (err) {
      console.warn('Failed to load cart from localStorage, resetting to empty cart:', err);
      setItems([]);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Sync to localStorage whenever items state changes after mount
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to save cart to localStorage:', err);
    }
  }, [items, isInitialized]);

  const addToCart = (product: NormalizedProductItem, qty = 1, variant?: CartItemVariant) => {
    if (!product || !product.id) return;
    const cleanVariant = sanitizeVariant(variant);
    const wanted = sanitizeQty(qty);
    if (wanted <= 0) return;
    // Out-of-stock products can never enter the cart.
    const effectiveStock = product.stock ?? cleanVariant?.stock;
    if (effectiveStock === 0) return;
    const key = cartItemKey({ product });
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => cartItemKey(item) === key);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const merged = updated[existingIndex].quantity + wanted;
        updated[existingIndex] = {
          ...updated[existingIndex],
          product: { ...updated[existingIndex].product, ...product },
          ...(cleanVariant ? { variant: cleanVariant } : {}),
          quantity: clampToStock(merged, effectiveStock),
        };
        return updated;
      }
      return [
        ...prevItems,
        {
          product,
          quantity: clampToStock(wanted, effectiveStock),
          ...(cleanVariant ? { variant: cleanVariant } : {}),
        },
      ];
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    const key = cartLineKey(productId, variantId);
    setItems((prevItems) => prevItems.filter((item) => cartItemKey(item) !== key));
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    const qty = sanitizeQty(quantity);
    const key = cartLineKey(productId, variantId);
    if (qty <= 0) {
      setItems((prevItems) => prevItems.filter((item) => cartItemKey(item) !== key));
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        cartItemKey(item) === key
          ? { ...item, quantity: clampToStock(qty, item.product.stock ?? item.variant?.stock) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const totalPrice = items.reduce((acc, item) => {
    return acc + cartItemUnitPrice(item) * item.quantity;
  }, 0);

  const formattedTotalPrice = formatPrice(totalPrice);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        formattedTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
