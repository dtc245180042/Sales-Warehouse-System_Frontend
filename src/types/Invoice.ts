export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;      // % thuế GTGT (VD: 8, 10)
  taxAmount: number;
  subtotal: number;
  total: number;
}

export interface ElectronicInvoice {
  id: string;
  invoiceNumber: string;       // Số hoá đơn: 0012485
  invoiceCode: string;         // Ký hiệu & Mã: HD-202610-001
  templateCode: string;        // Mẫu số: 1/001
  series: string;              // Ký hiệu: 1K26TBB
  orderId: string;
  orderCode: string;
  issueDate: string;           // Ngày lập
  signedDate: string;          // Ngày ký số

  // Bên bán (Seller)
  sellerName: string;
  sellerTaxCode: string;
  sellerAddress: string;
  sellerPhone: string;
  sellerBankAccount: string;

  // Bên mua (Buyer - Đại lý)
  buyerName: string;
  buyerUnitName: string;
  buyerTaxCode: string;
  buyerAddress: string;
  buyerPhone: string;

  // Số liệu tài chính
  paymentMethod: string;
  currency: string;
  subtotal: number;            // Tổng tiền hàng chưa thuế
  taxRate: number;             // Thuế suất GTGT chung (%)
  taxAmount: number;           // Tiền thuế GTGT
  totalAmount: number;         // Tổng tiền thanh toán (đã có thuế)
  paidAmount: number;          // Đã thanh toán
  remainingDebt: number;       // Còn nợ
  amountInWords: string;       // Số tiền viết bằng chữ

  // Trạng thái phát hành & Ký số
  status: 'ISSUED' | 'CANCELLED';
  lookupCode: string;          // Mã tra cứu hoá đơn trên portal CQT
  taxAuthorityCode: string;    // Mã của Cơ quan thuế cấp

  digitalSignature: {
    signedBy: string;
    organization: string;
    signedAt: string;
    certificateSerial: string;
    isValid: boolean;
  };

  items: InvoiceItem[];

  // Quản lý hạn thanh toán & công nợ (SCRUM-757)
  dueDate?: string;            // Hạn thanh toán (VD: 2026-10-25)
  paymentStatus?: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
  daysOverdue?: number;        // Số ngày quá hạn
  daysRemaining?: number;      // Số ngày còn lại tới hạn
}

export interface AgentDebtSummary {
  creditLimit: number;         // Hạn mức công nợ được cấp (VD: 100,000,000 đ)
  totalDebt: number;           // Tổng còn nợ (VD: 45,200,000 đ)
  availableCredit: number;     // Hạn mức còn lại = creditLimit - totalDebt (VD: 54,800,000 đ)
  inDueDebt: number;           // Nợ trong hạn (VD: 35,200,000 đ)
  overdueDebt: number;         // Nợ quá hạn (VD: 10,000,000 đ)
  utilizationRate: number;     // Tỷ lệ sử dụng hạn mức (%)
  maxDebtDays: number;         // Số ngày công nợ cho phép (VD: 30 ngày)
  earliestDueDate?: string;    // Hạn thanh toán gần nhất
  overdueCount: number;        // Số hoá đơn quá hạn
  pendingCount: number;        // Số hoá đơn chờ thanh toán
}

