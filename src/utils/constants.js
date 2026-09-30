// Danh sách kho và địa bàn mẫu trong hệ thống
export const AVAILABLE_WAREHOUSES = [
  'Kho Tổng Hà Nội',
  'Kho Trung Chuyển Đà Nẵng',
  'Kho Phân Phối TP.HCM',
  'Kho Cần Thơ',
];

// Dữ liệu người dùng mẫu mặc định
export const DEFAULT_USER = {
  id: 'usr_001',
  name: 'Nguyễn Văn An',
  email: 'an.nguyen@khohang.vn',
  role: 'Quản lý kho',
  warehouse: 'Kho Tổng Hà Nội',
  avatar: '',
};

// SCRUM-198: Cấu hình bảo mật đăng nhập & khóa tài khoản
export const MAX_LOGIN_ATTEMPTS = 5;
export const ACCOUNT_LOCKOUT_DURATION_MINUTES = 15;
export const ACCOUNT_LOCKOUT_DURATION_MS = ACCOUNT_LOCKOUT_DURATION_MINUTES * 60 * 1000; // 15 phút

// SCRUM-200: Thời hạn (TTL) của liên kết khôi phục mật khẩu gửi qua email
export const EMAIL_RESET_LINK_TTL_MINUTES = 30;
export const EMAIL_RESET_LINK_TTL_MS = EMAIL_RESET_LINK_TTL_MINUTES * 60 * 1000; // 30 phút

// SCRUM-201: Ràng buộc độ dài mật khẩu tối thiểu
export const MIN_PASSWORD_LENGTH = 8;

