/**
 * routerGuard.js - Bộ kiểm tra phân quyền truy cập và điều hướng Router
 * Áp dụng nguyên tắc "Từ chối mặc định" (Deny-By-Default):
 * Mọi quyền không được khai báo rõ ràng đều bị TỪ CHỐI truy cập và không rò rỉ dữ liệu ngoài phạm vi.
 */

// Danh sách các Router Path định nghĩa chuẩn trong hệ thống OMS Pro
export const ROUTE_DEFINITIONS = {
  '/': { title: 'Trang chủ', public: true },
  '/login': { title: 'Đăng nhập', public: true },
  '/register': { title: 'Đăng ký', public: true },
  '/dashboard': { title: 'Tổng quan hệ thống', protected: true },
  '/admin/users': { title: 'Quản lý người dùng', protected: true, requiredRoles: ['admin'] },
  '/sales/orders': { title: 'Quản lý đơn hàng', protected: true, requiredRoles: ['admin', 'sales_mgr', 'sales_rep', 'customer'] },
  '/warehouse/stock': { title: 'Quản lý tồn kho', protected: true, requiredRoles: ['admin', 'wh_mgr', 'warehouse'] },
  '/finance/debts': { title: 'Công nợ & Tài chính', protected: true, requiredRoles: ['admin', 'accountant'] },
};

/**
 * Kiểm tra phân quyền truy cập Route theo Nguyên tắc Từ chối Mặc định (Deny-By-Default)
 * @param {string} path - Đường dẫn truy cập (ví dụ: '/admin/users' hoặc '#/admin/users')
 * @param {object|null} user - Đối tượng thông tin người dùng đang đăng nhập
 * @returns {object} { allowed: boolean, errorType: number|null, message: string }
 */
export function validateRouteAccess(path, user) {
  // Chuẩn hóa path từ URL Hash (nếu có `#`)
  const cleanPath = path.replace(/^#/, '').trim() || '/';

  // 1. NGUYÊN TẮC TỪ CHỐI MẶC ĐỊNH (Deny-by-default): Path không có trong định nghĩa hệ thống -> 404
  const routeConfig = ROUTE_DEFINITIONS[cleanPath];
  if (!routeConfig) {
    return {
      allowed: false,
      errorType: 404,
      message: `[Deny-By-Default] Đường dẫn '${cleanPath}' không tồn tại hoặc chưa được cấp phép.`
    };
  }

  // 2. Route công khai (Login, Register...) -> Cho phép truy cập
  if (routeConfig.public) {
    return { allowed: true, errorType: null, message: 'Cho phép truy cập' };
  }

  // 3. NGUYÊN TẮC TỪ CHỐI MẶC ĐỊNH: Chưa đăng nhập -> 401
  if (!user) {
    return {
      allowed: false,
      errorType: 401,
      message: '[Deny-By-Default] Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.'
    };
  }

  // 4. NGUYÊN TẮC TỪ CHỐI MẶC ĐỊNH: Quyền không được khai báo rõ ràng -> 403 Forbidden
  if (routeConfig.requiredRoles && routeConfig.requiredRoles.length > 0) {
    const userRoles = Array.isArray(user.roles) && user.roles.length > 0 
      ? user.roles 
      : [user.role].filter(Boolean);

    const hasPermission = routeConfig.requiredRoles.some(r => userRoles.includes(r));
    if (!hasPermission) {
      return {
        allowed: false,
        errorType: 403,
        message: `[Deny-By-Default] Vai trò của bạn (${userRoles.join(', ') || 'Không rõ'}) không được khai báo quyền xem '${routeConfig.title}'. Thao tác bị TỪ CHỐI!`
      };
    }
  }

  return { allowed: true, errorType: null, message: 'Được cấp quyền xem' };
}

/**
 * Kiểm tra phân vùng dữ liệu theo phạm vi quyền (Data Scoping Permission Guard)
 * Đảm bảo dữ liệu không bị rò rỉ ngoài phạm vi phụ trách của từng vai trò nghiệp vụ.
 */
export function enforceDataScopeAccess(user, resourceType, targetScope) {
  if (!user) return false;
  const userRoles = Array.isArray(user.roles) && user.roles.length > 0 
    ? user.roles 
    : [user.role].filter(Boolean);

  if (userRoles.includes('admin')) return true; // Admin có toàn quyền

  switch (resourceType) {
    case 'AGENCY_DATA':
      // NV Kinh doanh (sales_rep) chỉ được xem đại lý địa bàn gán (`assignedAgencies`)
      if (userRoles.includes('sales_rep')) {
        const assigned = Array.isArray(user.assignedAgencies) ? user.assignedAgencies : [];
        return assigned.includes(targetScope);
      }
      return userRoles.includes('sales_mgr');

    case 'WAREHOUSE_STOCK':
      // Thủ kho / Quản lý kho chỉ được can thiệp dữ liệu thuộc Kho gán (`user.warehouse` hoặc `user.assignedWarehouses`)
      if (userRoles.includes('warehouse') || userRoles.includes('wh_mgr')) {
        const assignedWhs = Array.isArray(user.assignedWarehouses) ? user.assignedWarehouses : [user.warehouse].filter(Boolean);
        return assignedWhs.includes(targetScope);
      }
      return false;

    case 'CUSTOMER_DEBT':
      // Đại lý (customer) chỉ được xem công nợ / đơn hàng của chính mình
      if (userRoles.includes('customer')) {
        return user.username === targetScope || user.fullName === targetScope;
      }
      return userRoles.includes('accountant') || userRoles.includes('sales_mgr');

    default:
      // NGUYÊN TẮC TỪ CHỐI MẶC ĐỊNH: Tài nguyên không rõ -> TỪ CHỐI (false)
      return false;
  }
}

/**
 * Lắng nghe sự thay đổi URL Hash và thực hiện điều hướng an toàn
 */
export function setupRouterGuardListener(userGetter, onNavigateError) {
  const handleHashChange = () => {
    const hash = window.location.hash || '#/';
    if (hash.startsWith('#/')) {
      const path = hash.replace(/^#/, '');
      const currentUser = typeof userGetter === 'function' ? userGetter() : null;
      const check = validateRouteAccess(path, currentUser);

      if (!check.allowed) {
        onNavigateError(check.errorType, check.message);
      }
    }
  };

  window.addEventListener('hashchange', handleHashChange);
  return () => window.removeEventListener('hashchange', handleHashChange);
}
