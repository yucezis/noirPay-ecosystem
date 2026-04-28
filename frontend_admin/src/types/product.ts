export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isActive: boolean;
  categoryId: string;
  categoryName: string;
}