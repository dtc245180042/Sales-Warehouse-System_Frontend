const AVAILABLE_ROLES = [
  {
    id: 'Quản trị viên',
    name: 'Quản trị viên',
    tag: 'Toàn quyền',
    description: 'Toàn quyền cấu hình hệ thống, quản lý người dùng và truy cập dữ liệu trên toàn bộ chi nhánh.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    badgeColor: 'blue',
    requirement: null,
  },
  {
    id: 'Quản lý kho',
    name: 'Quản lý kho',
    tag: 'Bắt buộc gán kho',
    description: 'Quản lý nhập xuất kho, kiểm kê hàng hóa, điều chuyển và xem báo cáo tồn kho tại các kho được gán.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    badgeColor: 'green',
    requirement: 'Yêu cầu chọn tối thiểu 1 kho',
  },
  {
    id: 'Nhân viên bán hàng',
    name: 'Nhân viên bán hàng',
    tag: 'Bắt buộc gán địa bàn',
    description: 'Tạo đơn đặt hàng, quản lý danh sách khách hàng và theo dõi chỉ tiêu doanh số theo địa bàn được phụ trách.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    badgeColor: 'purple',
    requirement: 'Yêu cầu chọn tối thiểu 1 địa bàn',
  },
];

export default function RoleSelector({
  selectedRoles = [],
  onToggleRole,
  disabledRoles = [],
  disabledReasons = {},
}) {
  return (
    <div className="assignment-section">
      <div className="section-header">
        <div className="section-header__title-group">
          <div className="section-step">1</div>
          <div>
            <h3 className="section-title">
              Gán vai trò người dùng <span className="required-star">*</span>
            </h3>
            <p className="section-desc">Chọn một hoặc nhiều vai trò chức năng để xác định quyền hạn của người dùng.</p>
          </div>
        </div>
        <div className="selected-counter">
          Đã chọn: <strong>{selectedRoles.length}</strong> vai trò
        </div>
      </div>

      <div className="role-cards-grid">
        {AVAILABLE_ROLES.map((role) => {
          const isSelected = selectedRoles.includes(role.id);
          const isDisabled = disabledRoles.includes(role.id);
          const disableReason = disabledReasons[role.id];

          return (
            <div
              key={role.id}
              className={`role-card ${isSelected ? 'role-card--active' : ''} ${isDisabled ? 'role-card--disabled' : ''}`}
              onClick={() => {
                if (!isDisabled) {
                  onToggleRole(role.id);
                }
              }}
              role="checkbox"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : 0}
              onKeyDown={(e) => {
                if (isDisabled) return;
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onToggleRole(role.id);
                }
              }}
            >
              <div className="role-card__header">
                <div className={`role-card__icon role-card__icon--${role.badgeColor}`}>
                  {role.icon}
                </div>
                <div className="role-card__check-indicator">
                  <div
                    className={`custom-checkbox ${isSelected ? 'checked' : ''} ${isDisabled ? 'custom-checkbox--locked' : ''}`}
                    title={isDisabled ? disableReason : ''}
                  >
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              <div className="role-card__body">
                <div className="role-card__title-row">
                  <h4 className="role-card__name">{role.name}</h4>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {isDisabled && (
                      <span className="role-tag role-tag--locked" title={disableReason}>
                        🔒 Đã khóa
                      </span>
                    )}
                    <span className={`role-tag role-tag--${role.badgeColor}`}>{role.tag}</span>
                  </div>
                </div>
                <p className="role-card__desc">{role.description}</p>
              </div>

              {isDisabled && disableReason ? (
                <div className="role-card__footer role-card__footer--locked">
                  <span className="locked-role-hint">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    {disableReason}
                  </span>
                </div>
              ) : role.requirement ? (
                <div className="role-card__footer">
                  <span className="requirement-hint">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {role.requirement}
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
