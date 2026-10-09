export type OrderStatus = 'draft' | 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'transfer' | 'card';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  unit?: string;
  price: number;
  quantity: number;
  discount: number;
  subtotal: number;
  appliedDiscountPolicyName?: string;
  discountRate?: number;
  discountAmount?: number;
}

export interface Order {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  staffId: string;
  staffName: string;
  note?: string;
  deliveryAddressId?: number;
  deliveryAddressName?: string;
  deliveryReceiverName?: string;
  deliveryPhone?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  expectedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderCalculateItem {
  product_id: string | number;
  quantity: number;
  price?: number;
  unit?: string;
}

export interface OrderCalculateRequest {
  customer_id: string;
  items: OrderCalculateItem[];
  price_list_id?: number;
}

export interface OrderCalculateItemResponse {
  product_id: string;
  sku?: string;
  name: string;
  unit?: string;
  unit_price: number;
  quantity: number;
  discount_amount: number;
  discount_rate?: number;
  subtotal: number;
  applied_discount_name?: string;
}

export interface OrderCalculateResponse {
  subtotal: number;
  discount: number;
  total: number;
  items: OrderCalculateItemResponse[];
}

export interface ProductSearchForOrder {
  id: number;
  sku: string;
  name: string;
  price: number;
  sale_price: number;
  stock: number;
  unit: string;
  packaging_spec?: string;
  available_units: string[];
}

// SCRUM-236 (S4-04): Gợi ý lịch sử mua hàng 3 tháng gần nhất
export interface PurchaseHistoryItemSuggestion {
  productId: string;
  sku?: string;
  name: string;
  unit: string;
  category?: string;
  categoryId?: number;
  avgQuantity: number;
  totalQuantity: number;
  orderCount: number;
  lastQuantity: number;
  lastPurchasedAt?: string;
  lastPrice: number;
  currentPrice: number;
  stock: number;
}

export interface PurchaseHistoryGroupSuggestion {
  category: string;
  categoryId?: number;
  itemCount: number;
  totalSuggestedQuantity: number;
  items: PurchaseHistoryItemSuggestion[];
}

export interface LastOrderItemSummary {
  productId: string;
  sku?: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
}

export interface LastOrderSummary {
  orderId: string;
  code: string;
  createdAt?: string;
  total: number;
  items: LastOrderItemSummary[];
}

export interface PurchaseHistorySuggestionResponse {
  customerId: string;
  customerName: string;
  timeWindowDays: number;
  totalOrdersInWindow: number;
  hasPurchaseHistory: boolean;
  items: PurchaseHistoryItemSuggestion[];
  groups: PurchaseHistoryGroupSuggestion[];
  lastOrder?: LastOrderSummary;
}

