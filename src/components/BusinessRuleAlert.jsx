export default function BusinessRuleAlert({
  errors = [],
  warnings = [],
  isValid = false,
  isDirty = false,
  isNonAdmin = true,
  missingBothScopes = false,
}) {
  // 1. Hiển thị lỗi chặn lưu (Validation Errors)
  if (errors.length > 0) {
    return (
      <div className="rule-alert rule-alert--error" role="alert">
        <div className="rule-alert__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="rule-alert__content">
          <h4 className="rule-alert__title">Chưa thể lưu cấu hình</h4>
          <ul className="rule-alert__list">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // 2. Hiển thị cảnh báo khi và chỉ khi chưa có cả kho VÀ địa bàn (Trừ Quản trị viên)
  if (warnings.length > 0 || (isNonAdmin && missingBothScopes)) {
    return (
      <div className="rule-alert rule-alert--warning" role="alert">
        <div className="rule-alert__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="rule-alert__content">
          <h4 className="rule-alert__title">Cảnh báo: Chưa đủ phạm vi truy cập</h4>
          {warnings.length > 0 ? (
            <ul className="rule-alert__list">
              {warnings.map((warn, idx) => (
                <li key={idx}>{warn}</li>
              ))}
            </ul>
          ) : (
            <p className="rule-alert__desc">
              Người dùng này không phải là Quản trị viên nên cần được gán ít nhất một kho hàng hoặc một địa bàn phụ trách để có thể truy xuất dữ liệu.
            </p>
          )}
        </div>
      </div>
    );
  }

  // 3. Trạng thái hợp lệ (đã chọn ít nhất 1 kho hoặc 1 địa bàn và thỏa mãn vai trò)
  if (isValid) {
    return (
      <div className="rule-alert rule-alert--success" role="status">
        <div className="rule-alert__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className="rule-alert__content">
          <h4 className="rule-alert__title">Cấu hình hợp lệ</h4>
          <p className="rule-alert__desc">
            {isDirty
              ? 'Các vai trò và phạm vi kho/địa bàn đã đầy đủ điều kiện để lưu cấu hình.'
              : 'Người dùng đã có đầy đủ phạm vi phân quyền hợp lệ.'}
          </p>
        </div>
      </div>
    );
  }

  // 4. Hướng dẫn mặc định
  return (
    <div className="rule-alert rule-alert--info">
      <div className="rule-alert__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>
      <div className="rule-alert__content">
        <h4 className="rule-alert__title">Quy tắc nghiệp vụ phân quyền</h4>
        <p className="rule-alert__desc">
          • Ngoại trừ <strong>Quản trị viên</strong> (toàn quyền), người dùng cần được gán ít nhất 1 kho hoặc 1 địa bàn.<br />
          • Không được tự thu hồi vai trò Quản trị viên của chính mình.
        </p>
      </div>
    </div>
  );
}
