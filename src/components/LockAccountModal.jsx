import { useState } from 'react';
import './LockAccountModal.css';

export default function LockAccountModal({
  isOpen,
  targetUser,
  onClose,
  onConfirmLock,
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !targetUser) return null;

  const isSalesStaff = targetUser.role === 'sales_rep' || targetUser.role === 'sales_mgr';

  const handleClose = () => {
    setReason('');
    setError('');
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Vui lòng nhập lý do khóa tài khoản (Bắt buộc theo quy định quản trị).');
      return;
    }

    setIsSubmitting(true);
    // Simulate brief processing for realism
    setTimeout(() => {
      onConfirmLock(targetUser.username, trimmed);
      setIsSubmitting(false);
      handleClose();
    }, 150);
  };

  const handleReasonChange = (e) => {
    setReason(e.target.value);
    if (error && e.target.value.trim()) {
      setError('');
    }
  };

  return (
    <div className="lock-modal-overlay" onClick={handleClose} role="dialog" aria-modal="true">
      <div className="lock-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="lock-modal-header lock-modal-header-danger">
          <div className="lock-modal-title-wrap">
            <div className="lock-modal-icon-badge danger">🔒</div>
            <div>
              <h3 className="lock-modal-title">Xác nhận Khóa tài khoản</h3>
              <p className="lock-modal-subtitle">Thao tác quản trị hệ thống an toàn</p>
            </div>
          </div>
          <button
            type="button"
            className="lock-modal-close-btn"
            onClick={handleClose}
            aria-label="Đóng hộp thoại"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="lock-modal-body">
            {/* Target User Info */}
            <div className="lock-modal-user-card">
              <div className="lock-modal-user-avatar">
                {(targetUser.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="lock-modal-user-info">
                <div className="lock-modal-user-name">{targetUser.fullName}</div>
                <div className="lock-modal-user-meta">
                  <span>@{targetUser.username}</span>
                  <span>•</span>
                  <span className="lock-modal-role-pill">
                    {targetUser.roleTitle || targetUser.role}
                  </span>
                  {targetUser.warehouse && (
                    <span>• 🏢 {targetUser.warehouse}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Input Reason Form */}
            <div className="lock-modal-form-group">
              <label htmlFor="lock-reason-input" className="lock-modal-label">
                <span>
                  Lý do khóa tài khoản <span className="lock-modal-required">*</span>
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {reason.length}/250 ký tự
                </span>
              </label>
              <textarea
                id="lock-reason-input"
                className={`lock-modal-textarea ${error ? 'has-error' : ''}`}
                placeholder="Ví dụ: Nhân sự nghỉ việc chuyển công tác, vi phạm chính sách công nợ, tạm khóa theo yêu cầu phòng nhân sự..."
                value={reason}
                onChange={handleReasonChange}
                maxLength={250}
                autoFocus
              />
              {error && (
                <div className="lock-modal-error-text">
                  <span>⚠️</span> {error}
                </div>
              )}
            </div>

            {/* Special Handover Warning for Sales Staff */}
            {isSalesStaff && (
              <div className="lock-modal-alert warning">
                <strong>⚠️ CẢNH BÁO BÀN GIAO ĐỊA BÀN:</strong>
                <div style={{ marginTop: '4px' }}>
                  Nhân sự này phụ trách danh sách đại lý địa bàn{' '}
                  {targetUser.assignedAgencies ? `(${targetUser.assignedAgencies.join(', ')})` : ''}.
                  Hệ thống yêu cầu Quản trị viên phân công bàn giao cho nhân viên khác ngay sau khi khóa!
                </div>
              </div>
            )}

            {/* Session Revocation Note */}
            <div className="lock-modal-alert danger-note">
              ℹ️ <strong>Thu hồi phiên tức thì:</strong> Khi tài khoản bị khóa, mọi phiên đăng nhập của người dùng trên toàn bộ hệ thống sẽ bị chấm dứt lập tức và không thể đăng nhập lại cho đến khi được mở khóa.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="lock-modal-footer">
            <button
              type="button"
              className="lock-modal-btn cancel"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="lock-modal-btn confirm-lock"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang khóa...' : '🔒 Xác nhận khóa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
