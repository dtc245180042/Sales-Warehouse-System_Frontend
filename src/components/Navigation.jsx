import { useMemo, useEffect } from 'react';
import { MENU_CONFIG, filterMenuByRole, getRoleDisplayName } from '../config/menuConfig';
import UserInformation from './UserInformation';
import './Navigation.css';

/**
 * SCRUM-302 & SCRUM-203: Dynamic Navigation Component
 *
 * Requirements met:
 * 1. Dynamic Menu & Functional Grouping (SCRUM-302):
 *    - Filters menu configuration dynamically based on user.role or user.permissions.
 *    - ABSOLUTE HIDING: Unauthorized items and empty groups are completely stripped out
 *      via Array filtering (never rendered in the DOM with disabled={true} or display:none).
 *    - Groups menu items by functional categories ("Bán hàng", "Quản lý Kho", "Cấu hình Hệ thống").
 *    - If all items within a functional group are unauthorized, hides the entire group container/header dynamically.
 *    - Prevents exposing unauthorized route names, labels, or feature parameters in the rendered HTML.
 *
 * 2. User Profile Display (SCRUM-203):
 *    - Full Name (user.name)
 *    - Translated Role in Vietnamese (e.g., admin -> "Quản trị viên", staff -> "Nhân viên bán hàng", customer -> "Đại lý")
 *    - Assigned Workplace/Warehouse (user.workplace - Kho/Địa bàn làm việc)
 *
 * 3. Mobile Responsive (360px Viewport):
 *    - Touch-friendly targets (minimum 44px x 44px)
 *    - Text truncation (text-overflow: ellipsis, white-space: nowrap)
 *    - Smooth open/close mobile drawer with backdrop overlay
 */
export default function Navigation({
  user,
  activeItemId,
  onSelectItem,
  isOpen = false,
  onClose = () => {},
  onLogout = () => {},
  onRoleChange,
  onViewProfile
}) {
  const userRole = user?.role || 'customer';

  // Keyboard accessibility: Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // SCRUM-302: Dynamically filter menu configuration based on user role and permissions
  // ABSOLUTE HIDING: unauthorized items and empty functional groups are stripped before render
  const filteredGroups = useMemo(() => {
    return filterMenuByRole(MENU_CONFIG, userRole, user?.permissions || []);
  }, [userRole, user?.permissions]);

  const handleItemClick = (item) => {
    if (onSelectItem) {
      onSelectItem(item);
    }
    // Auto-close drawer on mobile when an item is selected
    onClose();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      <div
        className={`nav-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Navigation Sidebar / Drawer */}
      <aside
        className={`nav-sidebar ${isOpen ? 'open' : ''}`}
        aria-label="Menu điều hướng chính"
        id="main-navigation-sidebar"
      >
        <div className="nav-sidebar-scrollable">
          {/* Header Row with Close Button (44x44px touch target on mobile) */}
          <div className="nav-header-row">
            <span className="nav-header-title">
              PHÂN HỆ {getRoleDisplayName(userRole).toUpperCase()}
            </span>
            <button
              type="button"
              className="nav-close-btn"
              onClick={onClose}
              aria-label="Đóng menu điều hướng"
              title="Đóng menu điều hướng (Esc)"
              id="nav-close-btn"
            >
              ✕
            </button>
          </div>

          {/* SCRUM-203: User Profile Panel (Name, Translated Role, Workplace) */}
          <UserInformation
            user={user}
            variant="panel"
            onClick={() => {
              if (onViewProfile) onViewProfile();
              onClose();
            }}
          />

          {/* Interactive Role Switcher (For testing and verifying dynamic permissions) */}
          {onRoleChange && (
            <div className="nav-role-switcher-container">
              <label htmlFor="nav-role-select" className="nav-role-switcher-label">
                🔍 CHUYỂN VAI TRÒ (TEST QUYỀN):
              </label>
              <select
                id="nav-role-select"
                value={userRole}
                onChange={(e) => {
                  onRoleChange(e.target.value);
                  onClose();
                }}
                className="nav-role-select"
                aria-label="Chọn vai trò người dùng để test phân quyền động"
              >
                <option value="customer">Đại lý (Customer)</option>
                <option value="staff">Nhân viên bán hàng (Staff)</option>
                <option value="admin">Quản trị viên (Admin)</option>
              </select>
            </div>
          )}

          {/* SCRUM-302: Dynamically Rendered Functional Groups & Items */}
          {/* ABSOLUTE HIDING: Only permitted items and non-empty groups exist in this tree */}
          <nav className="nav-menu-tree" aria-label="Danh mục chức năng theo quyền">
            {filteredGroups.map((group) => {
              const childItems = group.items || group.children || [];
              return (
                <div key={group.id} className="nav-group-container" data-group-id={group.id}>
                  <div className="nav-group-header">
                    {group.icon && (
                      <span className="nav-group-icon" aria-hidden="true">
                        {group.icon}
                      </span>
                    )}
                    <span className="nav-group-title">{group.title}</span>
                  </div>

                  <div className="nav-group-items" role="group" aria-label={group.title}>
                    {childItems.map((item) => {
                      const isActive = activeItemId === item.id;
                      const subItems = item.items || item.children;

                      return (
                        <div key={item.id} className="nav-item-wrapper">
                          <button
                            type="button"
                            className={`nav-item-btn ${isActive ? 'active' : ''}`}
                            onClick={() => handleItemClick(item)}
                            aria-current={isActive ? 'page' : undefined}
                            id={`nav-item-${item.id}`}
                            title={item.label}
                          >
                            {item.icon && (
                              <span className="nav-item-icon" aria-hidden="true">
                                {item.icon}
                              </span>
                            )}
                            <span className="nav-item-label">{item.label}</span>
                          </button>

                          {/* Recursive Sub-item rendering if nested levels exist */}
                          {Array.isArray(subItems) && subItems.length > 0 && (
                            <div className="nav-sub-items">
                              {subItems.map((sub) => {
                                const isSubActive = activeItemId === sub.id;
                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    className={`nav-sub-item-btn ${isSubActive ? 'active' : ''}`}
                                    onClick={() => handleItemClick(sub)}
                                    aria-current={isSubActive ? 'page' : undefined}
                                    id={`nav-item-${sub.id}`}
                                    title={sub.label}
                                  >
                                    {sub.icon && (
                                      <span className="nav-item-icon" aria-hidden="true">
                                        {sub.icon}
                                      </span>
                                    )}
                                    <span className="nav-item-label">{sub.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Logout Button */}
        <div className="nav-sidebar-footer">
          <button
            type="button"
            className="nav-logout-btn"
            id="nav-logout-btn"
            onClick={() => {
              onClose();
              onLogout();
            }}
            title="Đăng xuất tập trung khỏi hệ thống"
          >
            <span aria-hidden="true">🚪</span>
            <span>Đăng xuất tập trung</span>
          </button>
        </div>
      </aside>
    </>
  );
}
