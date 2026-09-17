import { CartItem } from '@/types/cart';
import { formatPrice, parseNumericPrice } from '@/lib/api';
import { cartItemUnitPrice } from '@/types/cart';

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  notes?: string;
}

export const generateWhatsAppOrderMessage = (
  customer: CustomerInfo,
  items: CartItem[],
  formattedTotal: string
): string => {
  let message = `Halo LILLO, saya ingin memesan.\n\n`;
  message += `*DETAIL PELANGGAN*\n`;
  message += `Nama: ${customer.name.trim()}\n`;
  message += `No. HP: ${customer.phone.trim()}\n`;
  message += `Alamat: ${customer.address.trim()}\n\n`;

  message += `*DETAIL PESANAN*\n`;
  items.forEach((item, index) => {
    const unitPriceNum = cartItemUnitPrice(item);
    const subtotalStr = formatPrice(unitPriceNum * item.quantity);
    message += `${index + 1}. ${item.product.name}\n`;
    message += `   Jumlah: ${item.quantity}\n`;
    message += `   Harga: ${formatPrice(unitPriceNum)}\n`;
    message += `   Subtotal: ${subtotalStr}\n\n`;
  });

  message += `*TOTAL: ${formattedTotal}*\n`;

  if (customer.notes && customer.notes.trim().length > 0) {
    message += `\nCatatan:\n${customer.notes.trim()}\n`;
  }

  message += `\nMohon informasi mengenai ketersediaan dan detail pembayarannya.\n`;
  message += `\nTerima kasih.`;

  return message;
};

export const getWhatsAppCheckoutUrl = (
  customer: CustomerInfo,
  items: CartItem[],
  formattedTotal: string
): { url: string | null; error?: string } => {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER;
  if (!waNumber) {
    return {
      url: null,
      error: 'WhatsApp business number is missing in environment variables (NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER).',
    };
  }

  const cleanNumber = waNumber.replace(/[^0-9]/g, '');
  if (!cleanNumber) {
    return {
      url: null,
      error: 'Invalid WhatsApp business number format in environment configuration.',
    };
  }

  const rawMessage = generateWhatsAppOrderMessage(customer, items, formattedTotal);
  const encodedMsg = encodeURIComponent(rawMessage);

  return {
    url: `https://wa.me/${cleanNumber}?text=${encodedMsg}`,
  };
};

export { parseNumericPrice };
