const ROLE_LABELS = {
  admin: 'Quản trị viên',
  staff: 'Nhân viên bán hàng',
  customer: 'Đại lý',
};

const fallbackText = (value, fallback) =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

export default function UserInformation({ user, role, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="userInformation" style={styles.container} aria-busy="true" aria-label="Đang tải thông tin người dùng">
        <span style={{ ...styles.skeleton, width: '112px' }} />
        <span style={{ ...styles.skeleton, width: '88px' }} />
        <span style={{ ...styles.skeleton, width: '104px' }} />
      </div>
    );
  }

  const displayName = fallbackText(user?.fullName, 'Tài khoản demo');
  const roleValue = role || user?.role;
  const displayRole = fallbackText(
    ROLE_LABELS[roleValue] || roleValue,
    'Vai trò chưa xác định',
  );
  const workplace = fallbackText(user?.workplace, 'Chưa chọn');

  return (
    <div className="userInformation" style={styles.container}>
      <span style={styles.name} title={displayName}>{displayName}</span>
      <span style={styles.detail} title={displayRole}>{displayRole}</span>
      <span style={styles.detail} title={`Kho/địa bàn: ${workplace}`}>
        Kho/địa bàn: {workplace}
      </span>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    maxWidth: '220px',
    gap: '2px',
    lineHeight: 1.25,
  },
  name: {
    overflow: 'hidden',
    color: '#1e293b',
    fontSize: '12px',
    fontWeight: 700,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  detail: {
    overflow: 'hidden',
    color: '#64748b',
    fontSize: '10px',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  skeleton: {
    display: 'block',
    height: '10px',
    borderRadius: '5px',
    backgroundColor: '#e2e8f0',
  },
};
