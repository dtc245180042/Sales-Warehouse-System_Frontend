export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'transfer' | 'card';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number; // Số lượng đặt
  deliveredQuantity?: number; // Số lượng thực giao (SCRUM-696)
  shortageReason?: string; // Lý do giao thiếu nếu có (SCRUM-696)
  unit?: string; // Đơn vị tính (Cái, Chiếc, Bộ, Thùng...)
  discount: number;
  subtotal: number;
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
  hasShortage?: boolean; // Đơn hàng có phát sinh giao thiếu (SCRUM-696)
  shortageResolution?: string; // Phương án xử lý giao thiếu: bù đợt 2, trừ công nợ...
  createdAt: string;
  updatedAt: string;
}
