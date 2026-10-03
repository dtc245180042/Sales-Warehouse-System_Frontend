export type ProductStatus = 'active' | 'out_of_stock' | 'low_stock' | 'inactive';

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  supplierId: string;
  supplierName: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: string;
  packagingSpecification?: string; // Quy cách đóng gói (SCRUM-220)
  image: string;
  description: string;
  status: ProductStatus;
  hasTransactions?: boolean; // Đã phát sinh giao dịch - không thể xóa (SCRUM-220/381)
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
}
