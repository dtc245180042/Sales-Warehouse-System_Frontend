import './LockAccountModal.css';

export default function UnlockAccountModal({
  isOpen,
  targetUser,
  onClose,
  onConfirmUnlock,
}) {
  if (!isOpen || !targetUser) return null;

  const handleConfirm = () => {
    onConfirmUnlock(targetUser.username);
    onClose();
  };

  return (
    <div className="lock-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="lock-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="lock-modal-header lock-modal-header-success">
          <div className="lock-modal-title-wrap">
            <div className="lock-modal-icon-badge success">🔓</div>
            <div>
              <h3 className="lock-modal-title">Xác nhận Mở khóa tài khoản</h3>
              <p className="lock-modal-subtitle">Khôi phục quyền truy cập hệ thống</p>
            </div>
          </div>
          <button
            type="button"
            className="lock-modal-close-btn"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="lock-modal-body">
          {/* Target User Info */}
          <div className="lock-modal-user-card">
            <div className="lock-modal-user-avatar" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
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
                {targetUser.warehouse && <span>• 🏢 {targetUser.warehouse}</span>}
              </div>
            </div>
          </div>

          {/* Previous Lock Reason if available */}
          {targetUser.lockReason && (
            <div className="lock-modal-alert danger-note">
              <strong>Lý do khóa trước đây:</strong> "{targetUser.lockReason}"
            </div>
          )}

          <div className="lock-modal-alert info">
            ✅ <strong>Quyền hạn sau mở khóa:</strong> Tài khoản này sẽ được khôi phục toàn bộ quyền truy cập và có thể đăng nhập vào hệ thống ngay lập tức.
          </div>
        </div>

        {/* Footer */}
        <div className="lock-modal-footer">
          <button type="button" className="lock-modal-btn cancel" onClick={onClose}>
            Hủy bỏ
          </button>
          <button type="button" className="lock-modal-btn confirm-unlock" onClick={handleConfirm}>
            🔓 Xác nhận mở khóa
          </button>
        </div>
      </div>
    </div>
  );
}
