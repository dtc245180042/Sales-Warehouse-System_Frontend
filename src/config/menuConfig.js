/**
 * SCRUM-302: Menu Configuration & Functional Grouping with Roles/Permissions
 */

export const ROLE_TRANSLATIONS = {
  admin: 'Quản trị viên',
  staff: 'Nhân viên bán hàng',
  customer: 'Đại lý',
  warehouse: 'Thủ kho',
  manager: 'Quản lý chi nhánh'
};

/**
 * Returns translated display name for a given user role.
 * Case-insensitive with safe fallback.
 *
 * @param {string} role - The role string (e.g., 'admin', 'staff', 'customer')
 * @returns {string} Vietnamese translated role name
 */
export const getRoleDisplayName = (role) => {
  if (!role) return 'Người dùng';
  const normalized = String(role).trim().toLowerCase();
  return ROLE_TRANSLATIONS[normalized] || role || 'Người dùng';
};

/**
 * Functional Grouped Menu Configuration
 * Grouped by functional categories (e.g., "Bán hàng", "Quản lý Kho", "Cấu hình Hệ thống").
 * Each item specifies required roles and optional fine-grained permissions.
 */
export const MENU_CONFIG = [
  {
    id: 'sales-group',
    title: 'Bán hàng',
    icon: '🛒',
    items: [
      {
        id: 'order-portal',
        label: 'Cổng Đặt hàng Đại lý',
        path: '/orders/portal',
        icon: '📦',
        roles: ['customer', 'admin'],
        permissions: ['ORDER_CREATE', 'ORDER_VIEW']
      },
      {
        id: 'pos-sales',
        label: 'Bán hàng & Xuất kho (POS)',
        path: '/sales/pos',
        icon: '⚡',
        roles: ['staff', 'admin'],
        permissions: ['POS_SALE_CREATE', 'POS_SALE_VIEW']
      },
      {
        id: 'order-history',
        label: 'Lịch sử Đơn hàng',
        path: '/orders/history',
        icon: '📜',
        roles: ['customer', 'staff', 'admin'],
        permissions: ['ORDER_HISTORY_VIEW']
      }
    ]
  },
  {
    id: 'warehouse-group',
    title: 'Quản lý Kho',
    icon: '🏬',
    items: [
      {
        id: 'inventory-check',
        label: 'Kiểm kê Kho hàng',
        path: '/warehouse/inventory',
        icon: '📋',
        roles: ['staff', 'admin'],
        permissions: ['INVENTORY_CHECK']
      },
      {
        id: 'stock-transfer',
        label: 'Điều chuyển Nội bộ',
        path: '/warehouse/transfer',
        icon: '🚚',
        roles: ['staff', 'admin'],
        permissions: ['STOCK_TRANSFER']
      },
      {
        id: 'supplier-import',
        label: 'Nhập kho Nhà cung cấp',
        path: '/warehouse/import',
        icon: '📥',
        roles: ['admin'],
        permissions: ['SUPPLIER_IMPORT']
      }
    ]
  },
  {
    id: 'debt-credit-group',
    title: 'Công nợ & Hạn mức',
    icon: '💳',
    items: [
      {
        id: 'agency-debt',
        label: 'Tra cứu Công nợ Đại lý',
        path: '/finance/debt',
        icon: '💰',
        roles: ['customer', 'admin'],
        permissions: ['DEBT_VIEW']
      },
      {
        id: 'credit-limit-approval',
        label: 'Duyệt Hạn mức Tín dụng',
        path: '/finance/credit-approval',
        icon: '🛠️',
        roles: ['admin'],
        permissions: ['CREDIT_LIMIT_APPROVE']
      }
    ]
  },
  {
    id: 'system-group',
    title: 'Cấu hình Hệ thống',
    icon: '⚙️',
    items: [
      {
        id: 'system-overview',
        label: 'Tổng quan Quản trị',
        path: '/admin/overview',
        icon: '📊',
        roles: ['admin'],
        permissions: ['SYSTEM_OVERVIEW_VIEW']
      },
      {
        id: 'agency-management',
        label: 'Hệ thống Đại lý',
        path: '/admin/agencies',
        icon: '🏢',
        roles: ['admin'],
        permissions: ['AGENCY_MANAGE']
      },
      {
        id: 'user-management',
        label: 'Quản lý Người dùng & Phân quyền',
        path: '/admin/users',
        icon: '👥',
        roles: ['admin'],
        permissions: ['USER_MANAGE']
      }
    ]
  }
];

/**
 * Filter menu configuration dynamically based on user role and permissions.
 *
 * CRITICAL RULE (ABSOLUTE HIDING - SCRUM-302):
 * - Any menu item or feature for which the user lacks permission MUST NOT be rendered in the DOM
 *   (do NOT use disabled={true} or CSS display:none). Completely strip them out using Array filtering.
 * - Group menu items by functional categories (e.g., "Bán hàng", "Quản lý Kho", "Cấu hình Hệ thống").
 * - If all items within a functional group are unauthorized, hide the entire group container/header dynamically.
 * - Prevent exposing unauthorized route names, labels, or feature parameters in the rendered HTML/DOM.
 * - Recursively filters nested sub-items or branches of any arbitrary depth.
 *
 * @param {Array} menuConfig - The full menu grouping array.
 * @param {string} userRole - The active role of the user (e.g. 'admin', 'staff', 'customer').
 * @param {Array<string>} [userPermissions=[]] - Optional custom permission codes.
 * @returns {Array} Filtered menu groups with only authorized items and non-empty groups.
 */
export function filterMenuByRole(menuConfig, userRole, userPermissions = []) {
  if (!Array.isArray(menuConfig) || !userRole) {
    return [];
  }

  const normalizedRole = String(userRole).trim().toLowerCase();
  const permissionsList = Array.isArray(userPermissions)
    ? userPermissions.map((p) => String(p).trim().toUpperCase())
    : [];

  // Helper to check if a specific item or group has role & permission authorization
  const isNodeAuthorized = (item) => {
    // 1. Check role permission
    if (Array.isArray(item.roles) && item.roles.length > 0) {
      const allowedRoles = item.roles.map((r) => String(r).trim().toLowerCase());
      if (!allowedRoles.includes(normalizedRole)) {
        return false;
      }
    }

    // 2. Check explicit permission codes if defined on the item and provided by user
    if (Array.isArray(item.permissions) && item.permissions.length > 0) {
      if (permissionsList.length > 0) {
        const itemPermissions = item.permissions.map((p) => String(p).trim().toUpperCase());
        const hasPermission = itemPermissions.some((perm) => permissionsList.includes(perm));
        if (!hasPermission) {
          return false;
        }
      }
    }

    return true;
  };

  // Recursive filtering function supporting items, children, or subItems
  const filterBranch = (nodes) => {
    if (!Array.isArray(nodes)) return [];

    return nodes.reduce((authorizedNodes, node) => {
      // If node itself fails authorization, ABSOLUTE HIDING: completely exclude it
      if (!isNodeAuthorized(node)) {
        return authorizedNodes;
      }

      // Check for nested children/items
      const childKey = Array.isArray(node.items)
        ? 'items'
        : Array.isArray(node.children)
        ? 'children'
        : Array.isArray(node.subItems)
        ? 'subItems'
        : null;

      if (childKey) {
        const filteredChildren = filterBranch(node[childKey]);

        // If this is a group container and ALL its children are unauthorized:
        // ABSOLUTE HIDING: hide the entire group container/header dynamically
        if (filteredChildren.length === 0) {
          return authorizedNodes;
        }

        // Return a fresh copy containing only authorized sub-items
        authorizedNodes.push({
          ...node,
          [childKey]: filteredChildren
        });
      } else {
        // Leaf item: authorized, return a clean clone
        authorizedNodes.push({ ...node });
      }

      return authorizedNodes;
    }, []);
  };

  return filterBranch(menuConfig);
}
