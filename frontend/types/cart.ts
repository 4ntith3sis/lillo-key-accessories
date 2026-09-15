import { NormalizedProductItem } from '@/lib/api';

export interface CartItemVariant {
  variantId?: string;
  colorId?: string;
  colorName?: string;
  colorHex?: string;
  sku?: string;
  price?: number;
  stock?: number;
}

export interface CartItem {
  product: NormalizedProductItem;
  quantity: number;
  variant?: CartItemVariant;
}

/** Unique identity of a cart line: product ID. */
export const cartItemKey = (item: Pick<CartItem, 'product'>): string =>
  cartLineKey(item.product.id);

/** Same identity from raw product id (for remove/update calls). */
export const cartLineKey = (productId: string, _variantId?: string): string =>
  productId;

export const cartItemUnitPrice = (item: CartItem): number => {
  if (item.variant?.price !== undefined && !isNaN(Number(item.variant.price))) {
    return Number(item.variant.price);
  }
  const raw = item.product.price;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  const num = parseInt(String(raw).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
};

export interface CartContextType {
  items: CartItem[];
  addToCart: (product: NormalizedProductItem, qty?: number, variant?: CartItemVariant) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  formattedTotalPrice: string;
}

