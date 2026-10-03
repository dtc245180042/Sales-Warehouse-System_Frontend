export interface FieldChange {
  field: string;         // Mã trường (ví dụ: quantity, price)
  fieldName: string;     // Tên hiển thị tiếng Việt (ví dụ: Số lượng tồn)
  oldValue: string | number | null; // Giá trị trước
  newValue: string | number | null; // Giá trị sau
}

export interface AuditLogDetail {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  actionName: string;    // Ví dụ: "Cập nhật thông tin sản phẩm"
  module: string;        // Ví dụ: "Quản lý kho"
  targetEntity: string;  // Ví dụ: "Sản phẩm: SP-00124 (Áo Nam)"
  performedBy: {
    name: string;
    email: string;
    role?: string;
  };
  timestamp: string;     // Thời điểm thao tác
  ipAddress?: string;
  changes: FieldChange[];
}
