import { WAREHOUSES_LIST } from '../utils/assignmentData';

export default function WarehouseSelector({
  selectedWarehouses = [],
  primaryWarehouse = null,
  onToggleWarehouse,
  onSelectAll,
  onClearAll,
  onSetPrimaryWarehouse,
  isRequired = false,
  hasError = false,
  isAdmin = false,
  hasOtherScope = false,
}) {
  const allSelected = selectedWarehouses.length === WAREHOUSES_LIST.length;
  const isUnassigned = selectedWarehouses.length === 0;

  return (
    <div className={`assignment-section ${hasError ? 'assignment-section--has-error' : ''}`}>
      <div className="section-header">
        <div className="section-header__title-group">
          <div className="section-step">2</div>
          <div>
            <h3 className="section-title">
              Gán kho hàng phụ trách {isRequired && <span className="required-star">*</span>}
            </h3>
            <p className="section-desc">
              Chỉ định các kho hàng mà người dùng được cấp quyền truy xuất dữ liệu xuất nhập tồn và kiểm kê.
            </p>
          </div>
        </div>

        <div className="section-header__actions">
          <button
            type="button"
            className="action-link-btn"
            onClick={allSelected ? onClearAll : onSelectAll}
          >
            {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả kho'}
          </button>
          <div className="selected-counter">
            Đã chọn: <strong>{selectedWarehouses.length}</strong> / {WAREHOUSES_LIST.length} kho
          </div>
        </div>
      </div>

      {isAdmin ? (
        <div className="section-context-badge section-context-badge--admin-exemption">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>
            Người dùng đang có vai trò <strong>Quản trị viên</strong> (Toàn quyền hệ thống). Được phép truy cập tất cả các kho mà không bắt buộc phải gán thủ công bên dưới.
          </span>
        </div>
      ) : isRequired ? (
        <div className="section-context-badge section-context-badge--warning">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            {isUnassigned ? (
              <><strong>Cần gán kho:</strong> Người dùng có vai trò <strong>Quản lý kho</strong> nên cần chọn ít nhất 1 kho phụ trách.</>
            ) : (
              <>Người dùng có vai trò <strong>Quản lý kho</strong>. Yêu cầu duy trì tối thiểu 1 kho được gán.</>
            )}
          </span>
        </div>
      ) : !hasOtherScope && isUnassigned ? (
        <div className="section-context-badge section-context-badge--warning">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            <strong>Chưa gán phạm vi:</strong> Người dùng chưa có kho hoặc địa bàn nào. Vui lòng chọn ít nhất 1 kho hoặc 1 địa bàn bên dưới.
          </span>
        </div>
      ) : null}

      <div className="item-cards-grid">
        {WAREHOUSES_LIST.map((wh) => {
          const isSelected = selectedWarehouses.includes(wh.name);
          const isPrimary = primaryWarehouse === wh.name;

          return (
            <div
              key={wh.id}
              className={`scope-card ${isSelected ? 'scope-card--active' : ''}`}
              onClick={() => onToggleWarehouse(wh.name)}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onToggleWarehouse(wh.name);
                }
              }}
            >
              <div className="scope-card__top">
                <div className="scope-card__check">
                  <div className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="scope-card__code-badge">{wh.code}</div>
              </div>

              <div className="scope-card__content">
                <h4 className="scope-card__title">{wh.name}</h4>
                <p className="scope-card__subtitle">{wh.type}</p>
                <div className="scope-card__meta">
                  <span className="meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {wh.address}
                  </span>
                  <span className="meta-item meta-item--highlight">
                    Quy mô: {wh.capacity}
                  </span>
                </div>
              </div>

              {isSelected && (
                <div className="scope-card__footer" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`default-badge-btn ${isPrimary ? 'active' : ''}`}
                    onClick={() => onSetPrimaryWarehouse(isPrimary ? null : wh.name)}
                    title={isPrimary ? 'Kho làm việc mặc định' : 'Đặt làm kho mặc định'}
                  >
                    {isPrimary ? '★ Kho chính' : 'Đặt làm kho chính'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
