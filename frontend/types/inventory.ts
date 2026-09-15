export interface Inventory {
  id: string;
  productId: string;
  stock: number;
  updatedAt?: string;
}

export type StockTransactionType = 'STOCK_IN' | 'STOCK_OUT';

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: StockTransactionType;
  quantity: number;
  description: string;
  stockBefore: number;
  stockAfter: number;
  createdAt: string;
}
