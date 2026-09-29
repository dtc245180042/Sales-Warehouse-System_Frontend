import { getRoleDisplayName } from '../config/menuConfig';

/**
 * SCRUM-203: User Profile Information Display Component
 * Renders user profile details:
 * - Full Name (user.name || user.fullName)
 * - Translated Role in Vietnamese (e.g., admin -> "Quản trị viên", staff -> "Nhân viên bán hàng", customer -> "Đại lý")
 * - Assigned Workplace/Warehouse (user.workplace - Kho/Địa bàn làm việc)
 *
 * Includes text truncation (text-overflow: ellipsis, white-space: nowrap)
 * and touch-friendly interaction (>= 44x44px) for 360px viewports.
 */
export default function UserInformation({
  user,
  variant = 'panel', // 'panel' for sidebar/drawer, 'compact' for header pill
  onClick,
  className = ''
}) {
  const displayName = user?.name || user?.fullName || 'Người dùng hệ thống';
  const roleCode = user?.role || 'customer';
  const translatedRole = getRoleDisplayName(roleCode);
  const workplace =
    user?.workplace ||
    (String(roleCode).toLowerCase() === 'staff'
      ? 'Kho Thái Nguyên'
      : String(roleCode).toLowerCase() === 'admin'
      ? 'Kho Tổng Hà Nội'
      : 'Khu vực Miền Bắc');
  const avatarLetter = (user?.username || displayName || 'U').charAt(0).toUpperCase();

  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  if (variant === 'compact') {
    return (
      <div
        className={`user-info-compact ${className}`}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        title={`${displayName} • ${translatedRole} • ${workplace}`}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={`Hồ sơ người dùng: ${displayName} (${translatedRole}, ${workplace})`}
        id="user-profile-compact"
      >
        <div className="user-avatar-circle" aria-hidden="true">
          {avatarLetter}
        </div>
        <div className="user-compact-text">
          <span className="user-compact-name">{displayName}</span>
          <span className="user-compact-meta">
            {translatedRole} • {workplace}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`user-info-panel ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      title={`${displayName} • ${translatedRole} • ${workplace}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Thông tin tài khoản: ${displayName}`}
      id="user-profile-panel"
    >
      <div className="user-info-panel-top">
        <div className="user-avatar-circle large" aria-hidden="true">
          {avatarLetter}
        </div>
        <div className="user-info-panel-details">
          <div className="user-info-fullname" title={displayName}>
            {displayName}
          </div>
          <span className="user-info-role-badge" title={`Vai trò: ${translatedRole}`}>
            🎭 {translatedRole}
          </span>
        </div>
      </div>

      <div className="user-info-workplace" title={`Kho/Địa bàn làm việc: ${workplace}`}>
        <span className="user-workplace-icon" aria-hidden="true">🏬</span>
        <span className="user-workplace-label">Kho/Địa bàn:</span>
        <span className="user-workplace-text">{workplace}</span>
      </div>
    </div>
  );
}
