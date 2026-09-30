const ROLE_STYLES = {
  'Quản trị viên': {
    bg: '#eff6ff',
    border: '#bfdbfe',
    text: '#1d4ed8',
    dot: '#3b82f6',
  },
  'Quản lý kho': {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    text: '#15803d',
    dot: '#22c55e',
  },
  'Nhân viên bán hàng': {
    bg: '#fdf4ff',
    border: '#f5d0fe',
    text: '#a21caf',
    dot: '#d946ef',
  },
};

export default function RoleBadge({
  role,
  size = 'normal',
  onRemove = null,
  isLocked = false,
  lockTooltip = 'Không thể xóa vai trò này',
}) {
  const style = ROLE_STYLES[role] || {
    bg: '#f1f5f9',
    border: '#cbd5e1',
    text: '#475569',
    dot: '#64748b',
  };

  const isSmall = size === 'small';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: isSmall ? '2px 8px' : '4px 10px',
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '9999px',
        color: style.text,
        fontSize: isSmall ? '12px' : '13px',
        fontWeight: 600,
        lineHeight: 1.2,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: style.dot,
        }}
      />
      <span>{role}</span>

      {isLocked ? (
        <span
          title={lockTooltip}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '11px',
            color: '#64748b',
            cursor: 'not-allowed',
            marginLeft: '2px',
          }}
          aria-label={lockTooltip}
        >
          🔒
        </span>
      ) : onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(role);
          }}
          aria-label={`Xóa vai trò ${role}`}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '0 2px',
            cursor: 'pointer',
            color: style.text,
            fontSize: '14px',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
