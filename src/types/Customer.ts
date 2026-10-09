export interface Customer {
  id: string;
  code: string;
  name: string;
  taxCode?: string; // Mã số thuế
  customerGroup?: string; // Nhóm khách hàng
  region?: string; // Khu vực
  assigneeId?: string; // Người phụ trách (ID)
  assigneeName?: string; // Người phụ trách (Tên)
  phone: string;
  email: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
  status: 'active' | 'inactive';
}
