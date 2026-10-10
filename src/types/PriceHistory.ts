export interface ProductPriceHistory {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  oldSalePrice: number;
  newSalePrice: number;
  oldCostPrice?: number;
  newCostPrice?: number;
  effectiveDate: string; // YYYY-MM-DD HH:mm
  changedBy: string;     // Tên người thực hiện
  changedByRole?: string;
  reason: string;        // Lý do điều chỉnh
  note?: string;         // Ghi chú thêm
}
