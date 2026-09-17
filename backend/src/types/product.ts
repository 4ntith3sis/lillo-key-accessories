export interface Product {
  $id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  categoryId?: string;
  images?: string[];
  inStock?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
