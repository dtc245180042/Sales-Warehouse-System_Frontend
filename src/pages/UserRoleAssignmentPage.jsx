import { useState, useMemo } from 'react';
import RoleSelector from '../components/RoleSelector';
import WarehouseSelector from '../components/WarehouseSelector';
import TerritorySelector from '../components/TerritorySelector';
import RoleBadge from '../components/RoleBadge';
import BusinessRuleAlert from '../components/BusinessRuleAlert';
import { validateUserAssignment } from '../utils/validation';
import { INITIAL_USERS, WAREHOUSES_LIST, TERRITORIES_LIST } from '../utils/assignmentData';
import '../styles/role-assignment.css';

// ID của tài khoản Quản trị viên đang đăng nhập vào phiên làm việc hiện tại
const CURRENT_LOGGED_IN_USER_ID = 'USR-001';

export default function UserRoleAssignmentPage() {
  const [usersList, setUsersList] = useState(INITIAL_USERS);
  const [selectedUserId, setSelectedUserId] = useState(INITIAL_USERS[1].id);

  // Người dùng đang được chọn để gán quyền
  const currentUser = useMemo(() => {
    return usersList.find((u) => u.id === selectedUserId) || usersList[0];
  }, [usersList, selectedUserId]);

  // Kiểm tra xem người dùng đang thao tác có phải là chính mình không
  const isSelf = currentUser.id === CURRENT_LOGGED_IN_USER_ID;

  // Trạng thái dự thảo (Draft State) của form gán quyền
  const [draftRoles, setDraftRoles] = useState(currentUser.roles);
  const [draftWarehouses, setDraftWarehouses] = useState(currentUser.warehouses);
  const [draftPrimaryWarehouse, setDraftPrimaryWarehouse] = useState(currentUser.primaryWarehouse);
  const [draftTerritories, setDraftTerritories] = useState(currentUser.territories);

  const [toastMessage, setToastMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  // Khi đổi người dùng trong dropdown -> cập nhật lại dữ liệu dự thảo
  const handleUserChange = (userId) => {
    setSelectedUserId(userId);
    const target = usersList.find((u) => u.id === userId);
    if (target) {
      setDraftRoles([...target.roles]);
      setDraftWarehouses([...target.warehouses]);
      setDraftPrimaryWarehouse(target.primaryWarehouse);
      setDraftTerritories([...target.territories]);
    }
    setHasAttemptedSave(false);
    setToastMessage(null);
  };

  // Xác định người dùng có vai trò Quản trị viên hay không
  const isUserAdmin = draftRoles.includes('Quản trị viên');
  const wasUserAdmin = currentUser.roles.includes('Quản trị viên');

  // Vô hiệu hóa việc tự thu hồi vai trò Quản trị viên của chính mình
  const disabledRoles = useMemo(() => {
    if (isSelf && wasUserAdmin) {
      return ['Quản trị viên'];
    }
    return [];
  }, [isSelf, wasUserAdmin]);

  const disabledReasons = {
    'Quản trị viên': 'Không thể tự thu hồi vai trò Quản trị viên của chính mình để tránh mất quyền quản trị.',
  };

  // Kiểm tra tính hợp lệ của phân quyền
  const validation = useMemo(() => {
    return validateUserAssignment({
      roles: draftRoles,
      warehouses: draftWarehouses,
      territories: draftTerritories,
      isSelf,
      originalRoles: currentUser.roles,
    });
  }, [draftRoles, draftWarehouses, draftTerritories, isSelf, currentUser.roles]);

  // Kiểm tra xem form có bị thay đổi so với dữ liệu gốc không
  const isDirty = useMemo(() => {
    const rolesChanged = JSON.stringify(draftRoles.slice().sort()) !== JSON.stringify(currentUser.roles.slice().sort());
    const warehousesChanged = JSON.stringify(draftWarehouses.slice().sort()) !== JSON.stringify(currentUser.warehouses.slice().sort());
    const primaryChanged = draftPrimaryWarehouse !== currentUser.primaryWarehouse;
    const territoriesChanged = JSON.stringify(draftTerritories.slice().sort()) !== JSON.stringify(currentUser.territories.slice().sort());
    return rolesChanged || warehousesChanged || primaryChanged || territoriesChanged;
  }, [draftRoles, draftWarehouses, draftPrimaryWarehouse, draftTerritories, currentUser]);

  // Tương tác vai trò
  const handleToggleRole = (roleId) => {
    // Chặn thu hồi quyền Quản trị viên của chính mình
    if (roleId === 'Quản trị viên' && isSelf && wasUserAdmin) {
      setToastMessage('Bạn không thể tự thu hồi vai trò Quản trị viên của chính mình.');
      return;
    }

    setDraftRoles((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((r) => r !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  // Tương tác kho hàng
  const handleToggleWarehouse = (whName) => {
    setDraftWarehouses((prev) => {
      const isExist = prev.includes(whName);
      const next = isExist ? prev.filter((w) => w !== whName) : [...prev, whName];
      if (isExist && draftPrimaryWarehouse === whName) {
        setDraftPrimaryWarehouse(next[0] || null);
      }
      if (!isExist && prev.length === 0) {
        setDraftPrimaryWarehouse(whName);
      }
      return next;
    });
  };

  const handleSelectAllWarehouses = () => {
    const all = WAREHOUSES_LIST.map((w) => w.name);
    setDraftWarehouses(all);
    if (!draftPrimaryWarehouse && all.length > 0) {
      setDraftPrimaryWarehouse(all[0]);
    }
  };

  const handleClearAllWarehouses = () => {
    setDraftWarehouses([]);
    setDraftPrimaryWarehouse(null);
  };

  const handleSetPrimaryWarehouse = (whName) => {
    setDraftPrimaryWarehouse(whName);
  };

  // Tương tác địa bàn
  const handleToggleTerritory = (terName) => {
    setDraftTerritories((prev) => {
      if (prev.includes(terName)) {
        return prev.filter((t) => t !== terName);
      } else {
        return [...prev, terName];
      }
    });
  };

  const handleSelectAllTerritories = () => {
    setDraftTerritories(TERRITORIES_LIST.map((t) => t.name));
  };

  const handleClearAllTerritories = () => {
    setDraftTerritories([]);
  };

  // Khôi phục lại phân quyền ban đầu
  const handleReset = () => {
    setDraftRoles([...currentUser.roles]);
    setDraftWarehouses([...currentUser.warehouses]);
    setDraftPrimaryWarehouse(currentUser.primaryWarehouse);
    setDraftTerritories([...currentUser.territories]);
    setHasAttemptedSave(false);
  };

  // Lưu phân quyền
  const handleSave = () => {
    setHasAttemptedSave(true);
    if (!validation.isValid) {
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setUsersList((prev) =>
        prev.map((u) => {
          if (u.id === currentUser.id) {
            return {
              ...u,
              roles: [...draftRoles],
              warehouses: [...draftWarehouses],
              primaryWarehouse: draftPrimaryWarehouse,
              territories: [...draftTerritories],
              status: 'Hoạt động',
            };
          }
          return u;
        })
      );
      setIsSaving(false);
      setToastMessage(`Đã cập nhật phân quyền thành công cho người dùng ${currentUser.name}!`);
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    }, 400);
  };

  const isWarehouseRequired = draftRoles.includes('Quản lý kho');
  const isTerritoryRequired = draftRoles.includes('Nhân viên bán hàng');

  // Đã có ít nhất 1 kho HOẶC 1 địa bàn
  const hasAtLeastOneScope = draftWarehouses.length > 0 || draftTerritories.length > 0;

  // Lỗi hiển thị viền đỏ chỉ khi vi phạm yêu cầu vai trò hoặc hoàn toàn chưa có phạm vi nào
  const warehouseHasError =
    hasAttemptedSave &&
    ((isWarehouseRequired && draftWarehouses.length === 0) ||
      (!isUserAdmin && !hasAtLeastOneScope));

  const territoryHasError =
    hasAttemptedSave &&
    ((isTerritoryRequired && draftTerritories.length === 0) ||
      (!isUserAdmin && !hasAtLeastOneScope));

  return (
    <div className="assignment-screen">
      <div className="assignment-container">
        {/* Header màn hình gán */}
        <header className="screen-header">
          <div className="screen-header__badge-row">
            <span className="system-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Phân Quyền & Phạm Vi Truy Cập
            </span>
          </div>
          <h1 className="screen-title">Gán vai trò và kho/địa bàn cho người dùng</h1>
          <p className="screen-subtitle">
            Thiết lập vai trò chức năng cùng phạm vi dữ liệu kho hàng và địa bàn kinh doanh được phép phụ trách.
          </p>
        </header>

        {/* Thẻ chọn người dùng & hiển thị thông tin nhân viên */}
        <section className="user-selector-card" aria-label="Thông tin người dùng được gán">
          <div className="user-selector-card__left">
            <div className="user-avatar">
              {currentUser.name
                .split(' ')
                .slice(-2)
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="user-meta-info">
              <div className="user-name-row">
                <h2 className="user-name">{currentUser.name}</h2>
                {isSelf && (
                  <span className="self-badge" title="Tài khoản bạn đang sử dụng">
                    👤 Bạn (Đang đăng nhập)
                  </span>
                )}
                <span className="status-pill">
                  <span className="status-pill__dot" />
                  {currentUser.status}
                </span>
              </div>
              <div className="user-details">
                <span className="user-detail-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  {currentUser.email}
                </span>
                <span>•</span>
                <span className="user-detail-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  {currentUser.department}
                </span>
                <span>•</span>
                <span className="user-detail-item">Mã NV: {currentUser.id}</span>
              </div>
            </div>
          </div>

          <div className="user-selector-card__right">
            <label htmlFor="user-select-dropdown" className="selector-label">
              Chọn người dùng:
            </label>
            <select
              id="user-select-dropdown"
              className="user-dropdown"
              value={selectedUserId}
              onChange={(e) => handleUserChange(e.target.value)}
            >
              {usersList.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.id}) {user.id === CURRENT_LOGGED_IN_USER_ID ? '— [Bạn]' : ''} — {user.roles.join(', ') || 'Chưa gán vai trò'}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* CẢNH BÁO NỔI BẬT: CHỈ HIỂN THỊ KHI CHƯA CHỌN CẢ KHO LẪN ĐỊA BÀN (Trừ Quản trị viên) */}
        {!isUserAdmin && !hasAtLeastOneScope && (
          <div className="scope-warning-banner" role="alert">
            <div className="scope-warning-banner__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="scope-warning-banner__content">
              <h4 className="scope-warning-banner__title">
                Cảnh báo: Người dùng chưa được gán kho hàng hoặc địa bàn phụ trách
              </h4>
              <p className="scope-warning-banner__text">
                Ngoại trừ vai trò <strong>Quản trị viên</strong> (được cấp quyền toàn hệ thống), tất cả nhân viên khác cần được gán ít nhất một kho hàng hoặc một địa bàn kinh doanh để có thể truy cập dữ liệu tương ứng.
              </p>
            </div>
          </div>
        )}

        {/* Nội dung phân quyền: 2 Cột (Luồng thiết lập & Tóm tắt thao tác) */}
        <div className="assignment-layout">
          {/* Cột chính: Các bước gán quyền */}
          <main className="assignment-main-flow">
            {/* 1. Gán vai trò */}
            <RoleSelector
              selectedRoles={draftRoles}
              onToggleRole={handleToggleRole}
              disabledRoles={disabledRoles}
              disabledReasons={disabledReasons}
            />

            {/* 2. Gán kho hàng phụ trách */}
            <WarehouseSelector
              selectedWarehouses={draftWarehouses}
              primaryWarehouse={draftPrimaryWarehouse}
              onToggleWarehouse={handleToggleWarehouse}
              onSelectAll={handleSelectAllWarehouses}
              onClearAll={handleClearAllWarehouses}
              onSetPrimaryWarehouse={handleSetPrimaryWarehouse}
              isRequired={isWarehouseRequired}
              hasError={warehouseHasError}
              isAdmin={isUserAdmin}
              hasOtherScope={draftTerritories.length > 0}
            />

            {/* 3. Gán địa bàn kinh doanh */}
            <TerritorySelector
              selectedTerritories={draftTerritories}
              onToggleTerritory={handleToggleTerritory}
              onSelectAll={handleSelectAllTerritories}
              onClearAll={handleClearAllTerritories}
              isRequired={isTerritoryRequired}
              hasError={territoryHasError}
              isAdmin={isUserAdmin}
              hasOtherScope={draftWarehouses.length > 0}
            />
          </main>

          {/* Cột phụ: Tóm tắt phạm vi & Thao tác Lưu */}
          <aside className="assignment-sidebar">
            {/* Thẻ tóm tắt phân quyền thời gian thực */}
            <div className="summary-card">
              <div className="summary-card__header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <h3 className="summary-card__title">Tóm tắt phân quyền</h3>
              </div>

              {/* Vai trò */}
              <div className="summary-group">
                <div className="summary-group__label">
                  <span>Vai trò đã gán</span>
                  <span>{draftRoles.length} vai trò</span>
                </div>
                {draftRoles.length > 0 ? (
                  <div className="summary-group__tags">
                    {draftRoles.map((role) => (
                      <RoleBadge
                        key={role}
                        role={role}
                        size="small"
                        onRemove={handleToggleRole}
                        isLocked={isSelf && role === 'Quản trị viên'}
                        lockTooltip="Không thể tự thu hồi vai trò Quản trị viên của chính mình"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="empty-notice">Chưa chọn vai trò nào</p>
                )}
              </div>

              {/* Kho hàng */}
              <div className="summary-group">
                <div className="summary-group__label">
                  <span>Kho được truy cập</span>
                  <span>{draftWarehouses.length} kho</span>
                </div>
                {draftWarehouses.length > 0 ? (
                  <div className="summary-group__tags">
                    {draftWarehouses.map((wh) => {
                      const isPrimary = draftPrimaryWarehouse === wh;
                      return (
                        <span
                          key={wh}
                          className={`summary-tag ${isPrimary ? 'summary-tag--primary' : ''}`}
                        >
                          {isPrimary ? '★ ' : ''}
                          {wh}
                          <button
                            type="button"
                            className="summary-tag__remove"
                            onClick={() => handleToggleWarehouse(wh)}
                            title="Xóa kho này"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ) : isUserAdmin ? (
                  <p className="empty-notice" style={{ color: '#2563eb', fontStyle: 'normal' }}>
                    ✓ Toàn quyền mọi kho (Quản trị viên)
                  </p>
                ) : isWarehouseRequired ? (
                  <span className="empty-notice--warning">
                    ⚠️ Cần gán ít nhất 1 kho
                  </span>
                ) : (
                  <p className="empty-notice">
                    {draftTerritories.length > 0 ? 'Không gán kho (Đã có địa bàn)' : 'Chưa gán kho nào'}
                  </p>
                )}
              </div>

              {/* Địa bàn */}
              <div className="summary-group">
                <div className="summary-group__label">
                  <span>Địa bàn phụ trách</span>
                  <span>{draftTerritories.length} địa bàn</span>
                </div>
                {draftTerritories.length > 0 ? (
                  <div className="summary-group__tags">
                    {draftTerritories.map((ter) => (
                      <span key={ter} className="summary-tag">
                        {ter}
                        <button
                          type="button"
                          className="summary-tag__remove"
                          onClick={() => handleToggleTerritory(ter)}
                          title="Xóa địa bàn này"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : isUserAdmin ? (
                  <p className="empty-notice" style={{ color: '#2563eb', fontStyle: 'normal' }}>
                    ✓ Toàn quyền mọi địa bàn (Quản trị viên)
                  </p>
                ) : isTerritoryRequired ? (
                  <span className="empty-notice--warning">
                    ⚠️ Cần gán ít nhất 1 địa bàn
                  </span>
                ) : (
                  <p className="empty-notice">
                    {draftWarehouses.length > 0 ? 'Không gán địa bàn (Đã có kho)' : 'Chưa gán địa bàn nào'}
                  </p>
                )}
              </div>
            </div>

            {/* Cảnh báo kiểm tra quy tắc */}
            <BusinessRuleAlert
              errors={hasAttemptedSave ? validation.errors : []}
              warnings={validation.warnings}
              isValid={validation.isValid}
              isDirty={isDirty}
              isNonAdmin={!isUserAdmin}
              missingBothScopes={!hasAtLeastOneScope}
            />

            {/* Các nút hành động chính */}
            <div className="actions-card">
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spin-icon">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Lưu phân quyền
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleReset}
                disabled={isSaving || !isDirty}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Hoàn tác thay đổi
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Toast thông báo */}
      {toastMessage && (
        <div className="toast-banner toast-banner--success" role="status">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              marginLeft: '8px',
              fontSize: '16px',
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
