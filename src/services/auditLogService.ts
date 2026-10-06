import { AuditLogDetail } from '../types/auditLog';
import { getStorageItem, setStorageItem } from './storage';

const STORAGE_KEY = 'sws_audit_logs';

export const INITIAL_AUDIT_LOGS: AuditLogDetail[] = [
  {
    id: 'LOG-88392',
    action: 'UPDATE',
    actionName: 'Cập nhật số lượng tồn kho',
    module: 'Kiểm kê Kho',
    targetEntity: 'Mặt hàng: Máy in HP LaserJet Pro (SP-00124)',
    performedBy: {
      name: 'Thắng Nguyễn',
      email: 'thang.nguyen@codegym.vn',
      role: 'Thủ kho',
    },
    timestamp: '03/10/2026 23:15:20',
    ipAddress: '192.168.1.45',
    changes: [
      { field: 'quantity', fieldName: 'Số lượng tồn kho', oldValue: 150, newValue: 120 },
      { field: 'warehouse_location', fieldName: 'Vị trí kệ kho', oldValue: 'Kệ A2-01', newValue: 'Kệ B1-05' },
      { field: 'status', fieldName: 'Trạng thái kiểm kê', oldValue: 'Chờ duyệt', newValue: 'Đã hoàn thành' },
      { field: 'note', fieldName: 'Ghi chú', oldValue: null, newValue: 'Xuất kho kiểm định chất lượng' },
    ],
  },
  {
    id: 'LOG-88391',
    action: 'CREATE',
    actionName: 'Tạo mới tài khoản người dùng',
    module: 'Quản trị Người dùng',
    targetEntity: 'Tài khoản: hoang.nam@codegym.vn (Hoàng Văn Nam)',
    performedBy: {
      name: 'Quản trị viên Hệ thống',
      email: 'admin@codegym.vn',
      role: 'Quản trị viên',
    },
    timestamp: '03/10/2026 21:40:12',
    ipAddress: '192.168.1.10',
    changes: [
      { field: 'email', fieldName: 'Email đăng nhập', oldValue: null, newValue: 'hoang.nam@codegym.vn' },
      { field: 'fullName', fieldName: 'Họ và tên', oldValue: null, newValue: 'Hoàng Văn Nam' },
      { field: 'role', fieldName: 'Vai trò người dùng', oldValue: null, newValue: 'Nhân viên kinh doanh' },
      { field: 'region', fieldName: 'Địa bàn phụ trách', oldValue: null, newValue: 'Khu vực Miền Trung' },
      { field: 'status', fieldName: 'Trạng thái kích hoạt', oldValue: null, newValue: 'Chờ kích hoạt (Đã gửi email)' },
    ],
  },
  {
    id: 'LOG-88390',
    action: 'UPDATE',
    actionName: 'Khóa tài khoản và thu hồi phiên',
    module: 'An ninh Hệ thống',
    targetEntity: 'Tài khoản: le.van.c@codegym.vn (Lê Văn C)',
    performedBy: {
      name: 'Quản trị viên Hệ thống',
      email: 'admin@codegym.vn',
      role: 'Quản trị viên',
    },
    timestamp: '03/10/2026 16:05:48',
    ipAddress: '192.168.1.10',
    changes: [
      { field: 'status', fieldName: 'Trạng thái tài khoản', oldValue: 'Đang hoạt động', newValue: 'Đã bị khóa' },
      { field: 'lock_reason', fieldName: 'Lý do khóa', oldValue: null, newValue: 'Nhân viên nghỉ việc - Thu hồi quyền ngay lập tức' },
      { field: 'active_sessions', fieldName: 'Phiên làm việc', oldValue: '2 phiên đang mở', newValue: 'Đã thu hồi toàn bộ' },
    ],
  },
  {
    id: 'LOG-88389',
    action: 'DELETE',
    actionName: 'Xóa chương trình chiết khấu hết hạn',
    module: 'Quản lý Bán hàng',
    targetEntity: 'Chiết khấu: SALE_SUMMER_2026',
    performedBy: {
      name: 'Nguyễn Thị Mai',
      email: 'mai.nguyen@codegym.vn',
      role: 'Quản lý kinh doanh',
    },
    timestamp: '03/10/2026 14:22:05',
    ipAddress: '14.232.188.92',
    changes: [
      { field: 'promo_code', fieldName: 'Mã chiết khấu', oldValue: 'SALE_SUMMER_2026', newValue: null },
      { field: 'discount_rate', fieldName: 'Tỷ lệ chiết khấu', oldValue: '15%', newValue: null },
      { field: 'status', fieldName: 'Trạng thái áp dụng', oldValue: 'Hoạt động', newValue: null },
    ],
  },
  {
    id: 'LOG-88388',
    action: 'UPDATE',
    actionName: 'Điều chỉnh giá niêm yết sản phẩm',
    module: 'Quản lý Sản phẩm',
    targetEntity: 'Sản phẩm: Màn hình Dell UltraSharp 27 inch (SP-00088)',
    performedBy: {
      name: 'Trần Đình Trọng',
      email: 'trong.tran@codegym.vn',
      role: 'Quản lý kinh doanh',
    },
    timestamp: '02/10/2026 10:11:34',
    ipAddress: '192.168.1.33',
    changes: [
      { field: 'price', fieldName: 'Giá niêm yết (VNĐ)', oldValue: '12.500.000 đ', newValue: '11.890.000 đ' },
      { field: 'vat', fieldName: 'Thuế VAT', oldValue: '10%', newValue: '8%' },
      { field: 'warranty_month', fieldName: 'Thời hạn bảo hành', oldValue: '24 tháng', newValue: '36 tháng' },
    ],
  },
];

export const auditLogService = {
  /**
   * Lấy danh sách nhật ký kiểm toán (Audit Logs)
   */
  getAll: async (): Promise<AuditLogDetail[]> => {
    const logs = getStorageItem<AuditLogDetail[]>(STORAGE_KEY, INITIAL_AUDIT_LOGS);
    return logs;
  },

  /**
   * Lấy chi tiết một bản ghi Audit Log theo ID
   */
  getById: async (id: string): Promise<AuditLogDetail | null> => {
    const logs = getStorageItem<AuditLogDetail[]>(STORAGE_KEY, INITIAL_AUDIT_LOGS);
    return logs.find((l) => l.id === id) || null;
  },

  /**
   * Ghi thêm một log mới vào hệ thống
   */
  createLog: async (log: Omit<AuditLogDetail, 'id' | 'timestamp'>): Promise<AuditLogDetail> => {
    const logs = getStorageItem<AuditLogDetail[]>(STORAGE_KEY, INITIAL_AUDIT_LOGS);
    const newLog: AuditLogDetail = {
      ...log,
      id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toLocaleString('vi-VN'),
    };
    const updated = [newLog, ...logs];
    setStorageItem(STORAGE_KEY, updated);
    return newLog;
  },
};
