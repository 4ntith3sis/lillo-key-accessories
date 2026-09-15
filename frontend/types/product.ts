export interface Product {
  $id?: string;
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  price: number | string;
  category?: string;
  categoryId?: string;
  image?: string;
  images?: string[];
  inStock?: boolean;
  stock?: number;
  createdAt?: string;
  updatedAt?: string;
}
