import { TERRITORIES_LIST } from '../utils/assignmentData';

export default function TerritorySelector({
  selectedTerritories = [],
  onToggleTerritory,
  onSelectAll,
  onClearAll,
  isRequired = false,
  hasError = false,
  isAdmin = false,
  hasOtherScope = false,
}) {
  const allSelected = selectedTerritories.length === TERRITORIES_LIST.length;
  const isUnassigned = selectedTerritories.length === 0;

  return (
    <div className={`assignment-section ${hasError ? 'assignment-section--has-error' : ''}`}>
      <div className="section-header">
        <div className="section-header__title-group">
          <div className="section-step">3</div>
          <div>
            <h3 className="section-title">
              Gán địa bàn kinh doanh phụ trách {isRequired && <span className="required-star">*</span>}
            </h3>
            <p className="section-desc">
              Chỉ định các vùng/địa bàn kinh doanh mà nhân viên được phép tạo đơn hàng và quản lý khách hàng.
            </p>
          </div>
        </div>

        <div className="section-header__actions">
          <button
            type="button"
            className="action-link-btn"
            onClick={allSelected ? onClearAll : onSelectAll}
          >
            {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả địa bàn'}
          </button>
          <div className="selected-counter">
            Đã chọn: <strong>{selectedTerritories.length}</strong> / {TERRITORIES_LIST.length} địa bàn
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
            Người dùng đang có vai trò <strong>Quản trị viên</strong> (Toàn quyền hệ thống). Được phép truy cập dữ liệu mọi địa bàn mà không bắt buộc phải gán thủ công bên dưới.
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
              <><strong>Cần gán địa bàn:</strong> Người dùng có vai trò <strong>Nhân viên bán hàng</strong> nên cần chọn ít nhất 1 địa bàn phụ trách.</>
            ) : (
              <>Người dùng có vai trò <strong>Nhân viên bán hàng</strong>. Yêu cầu duy trì tối thiểu 1 địa bàn được gán.</>
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
            <strong>Chưa gán phạm vi:</strong> Người dùng chưa có kho hoặc địa bàn nào. Vui lòng chọn ít nhất 1 kho hoặc 1 địa bàn.
          </span>
        </div>
      ) : null}

      <div className="item-cards-grid">
        {TERRITORIES_LIST.map((ter) => {
          const isSelected = selectedTerritories.includes(ter.name);

          return (
            <div
              key={ter.id}
              className={`scope-card ${isSelected ? 'scope-card--active' : ''}`}
              onClick={() => onToggleTerritory(ter.name)}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onToggleTerritory(ter.name);
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
                <div className="scope-card__code-badge">{ter.code}</div>
              </div>

              <div className="scope-card__content">
                <h4 className="scope-card__title">{ter.name}</h4>
                <div className="scope-card__meta">
                  <span className="meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                    {ter.stats}
                  </span>
                  <p className="territory-provinces">{ter.provinces}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
