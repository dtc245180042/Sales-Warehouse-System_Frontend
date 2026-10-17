// Mock data for User / Nhân viên bán hàng portal
export interface ProductItem {
  id: string;
  code: string;
  sku?: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  image: string;
  unit: string;
  description: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  rating: number;
  soldCount: number;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

export interface OrderItemRecord {
  productId: string;
  productCode?: string;
  sku?: string;
  name?: string;
  productName?: string;
  price: number;
  quantity: number;
  image?: string;
  subtotal?: number;
  total?: number;
}

export type OrderStatusType = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'transfer' | 'e_wallet' | 'ewallet';

export interface UserOrder {
  id: string;
  code: string;
  orderNumber?: string;
  createdAt: string;
  staffId: string;
  staffName: string;
  createdByName?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  items: OrderItemRecord[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'unpaid';
  status: OrderStatusType;
  notes?: string;
  timeline?: {
    status?: string;
    title: string;
    time?: string;
    desc?: string;
    completed?: boolean;
    current?: boolean;
  }[];
}

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
  orderId?: string;
  link?: string;
}

export interface UserProfileData {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  roleTitle?: string;
  roleName?: string;
  department?: string;
  employeeId?: string;
  employeeCode?: string;
  avatar: string;
  createdAt?: string;
  joinedDate?: string;
  todayOrdersCount?: number;
  monthlyOrdersCount?: number;
  personalRevenue?: number;
  productsSoldCount?: number;
  storeInfo?: {
    name: string;
    address: string;
    phone: string;
    manager: string;
  };
}

export const mockCategories = [
  'Tất cả danh mục',
  'Điện thoại & Phụ kiện',
  'Laptop & Máy tính',
  'Thiết bị âm thanh',
  'Phụ kiện sạc & cáp',
  'Linh kiện mạng & lưu trữ',
];

export const initialMockProducts: ProductItem[] = [];

export const initialMockOrders: UserOrder[] = [];

export const initialMockNotifications: UserNotification[] = [];

export const initialUserProfile: UserProfileData = {
  id: 'USR-004',
  name: 'Nguyễn Văn A',
  username: 'user01',
  email: 'user@khovanpro.vn',
  phone: '0901234567',
  role: 'USER',
  roleTitle: 'Nhân viên bán hàng',
  roleName: 'Nhân viên bán hàng',
  department: 'Bộ phận Bán Hàng & POS',
  employeeId: 'NVBH-2026-08',
  employeeCode: 'NVBH-2026-08',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  createdAt: '15/01/2025',
  joinedDate: '15/01/2025',
  todayOrdersCount: 24,
  monthlyOrdersCount: 168,
  personalRevenue: 28500000,
  productsSoldCount: 312,
  storeInfo: {
    name: 'Chi nhánh SALEPRO Trung Tâm Quận 1',
    address: '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    phone: '1900 6868 - Máy lẻ 101',
    manager: 'Trần Minh Quân (Quản lý trưởng)',
  },
};

export const mockWeeklyRevenueChart: any[] = [];
