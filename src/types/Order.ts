export type OrderStatus =
  | 'draft'               // Nháp
  | 'pending'             // Chờ duyệt
  | 'pending_approval'    // Chờ phê duyệt ngoại lệ
  | 'confirmed'           // Đã duyệt
  | 'preparing'           // Đang soạn hàng
  | 'shipping'            // Đã xuất
  | 'completed'           // Đã giao
  | 'closed'              // Đóng
  | 'cancelled';          // Đã hủy

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
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  label: string;
  timestamp: string;
  performedBy?: string;
  role?: string;
  note?: string;
}

export interface Order {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  agentId?: string;
  agentName?: string;
  region?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax?: number;
  total: number;
  paidAmount: number;
  changeAmount?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  staffId: string;
  staffName: string;
  note?: string;
  expectedDeliveryDate?: string;
  deliveryAddressId?: number | string;
  deliveryAddress?: string;
  deliveryReceiverName?: string;
  deliveryPhone?: string;
  deliveryAddressName?: string;
  source?: string;
  channel?: string;
  timeline?: OrderTimelineEvent[];
  cancelledReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  closedAt?: string;
  closedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSearchForOrder {
  id: string;
  sku: string;
  name: string;
  unit: string;
  price: number;
  sale_price?: number;
  stock: number;
  availableUnits?: string[];
  available_units?: string[];
  category?: string;
  image?: string;
}

export interface OrderCalculateItem {
  product_id: string;
  quantity: number;
  price: number;
  unit?: string;
}

export interface PurchaseHistoryItemSuggestion {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  price: number;
  currentPrice?: number;
  lastPrice?: number;
  stock: number;
  lastPurchasedDate?: string;
  avgQuantity: number;
  totalOrdersCount: number;
  category?: string;
}

export interface PurchaseHistoryGroupSuggestion {
  category: string;
  itemCount: number;
  totalSuggestedQuantity: number;
  items: PurchaseHistoryItemSuggestion[];
}

export interface PurchaseHistorySuggestionResponse {
  customerId: string;
  windowDays: number;
  hasPurchaseHistory?: boolean;
  totalOrdersInWindow?: number;
  lastOrder?: any;
  items: PurchaseHistoryItemSuggestion[];
  groups: PurchaseHistoryGroupSuggestion[];
}

