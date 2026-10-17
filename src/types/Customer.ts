export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  customer_group?: string;
  customerGroup?: string;
  tax_code?: string;
  taxCode?: string;
  region?: string;
  assigned_sales_rep?: string;
  assignedSalesRep?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'locked';
  credit_limit?: number;
  creditLimit?: number;
  current_debt?: number;
  currentDebt?: number;
  max_debt_days?: number;
  maxDebtDays?: number;
  available_credit?: number;
  availableCredit?: number;
}

export interface SalesRep {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface CustomerAssignmentBrief {
  customerId: string;
  salesRepId: string;
  assignedAt: string;
}

export interface CustomerAssignmentHistory {
  id: string;
  customerId: string;
  salesRepId: string;
  salesRepName: string;
  assignedAt: string;
  assignedBy?: string;
  note?: string;
}

export interface CustomerFilterParams {
  search?: string;
  customer_group?: string;
  region?: string;
  assigned_sales_rep?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export interface CustomerPaginatedResponse {
  items: Customer[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CustomerFilterOptions {
  regions: string[];
  customer_groups: string[];
  sales_reps: string[];
  statuses: string[];
}
