export type OrderStatus =
  | 'draft'          // Nháp
  | 'pending'        // Chờ duyệt
  | 'confirmed'      // Đã duyệt
  | 'preparing'      // Đang soạn hàng
  | 'shipping'       // Đã xuất
  | 'completed'      // Đã giao
  | 'closed'         // Đóng
  | 'cancelled';     // Đã hủy

export type PaymentMethod = 'cash' | 'transfer' | 'card';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
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
  timeline?: OrderTimelineEvent[];
  cancelledReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  closedAt?: string;
  closedBy?: string;
  createdAt: string;
  updatedAt: string;
}
