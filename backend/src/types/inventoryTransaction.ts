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

export interface StockMovementInput {
  productId: string;
  type: StockTransactionType;
  quantity: number;
  description: string;
}
