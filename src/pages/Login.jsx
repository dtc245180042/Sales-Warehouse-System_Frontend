import { useState, useCallback } from 'react';
import TogglePassBtn from '../components/TogglePassBtn';

const DEMO_ACCOUNTS = [
  {
    label: '👑 Admin',
    username: 'admin',
    password: 'Admin@1234',
    roleTitle: 'Quản trị viên',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
  {
    label: '📊 Sales Rep',
    username: 'sales_rep',
    password: 'SalesRep@1234',
    roleTitle: 'Nhân viên Kinh doanh',
    color: '#0284c7',
    bg: '#e0f2fe',
    border: '#bae6fd',
  },
  {
    label: '🏢 Đại Lý',
    username: 'customer',
    password: 'Customer@1234',
    roleTitle: 'Đại lý cấp 1',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
];

const Login = ({ userList, setUser, setCurrentRole, setScreen, setPopup, styles, onLoginSubmit }) => {
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [hoveredBlock, setHoveredBlock] = useState(null);

  const doLogin = useCallback((username, password) => {
    const userKey = `login_attempts_${username.toLowerCase()}`;
    const now = Date.now();
    let attemptData = { count: 0, lockedUntil: null };

    try {
      const stored = localStorage.getItem(userKey);
      if (stored) {
        attemptData = JSON.parse(stored);
      }
    } catch {
      // Fallback if parsing fails
    }

    // Kiểm tra nếu tài khoản đang bị tạm khóa 15 phút do 5 lần nhập sai
    if (attemptData.lockedUntil && now < attemptData.lockedUntil) {
      const remainingMinutes = Math.ceil((attemptData.lockedUntil - now) / 60000);
      setPopup({
        show: true,
        title: 'Tài khoản tạm thời bị khóa (15 phút)',
        message: `Bạn đã nhập sai thông tin 5 lần liên tiếp. Tài khoản tạm thời bị khóa vì lý do an toàn. Vui lòng thử lại sau ${remainingMinutes} phút!`,
        type: 'error',
        onConfirm: () => setPopup(p => ({ ...p, show: false }))
      });
      return;
    }

    const foundAccount = userList.find(
      (a) => a.username.toLowerCase() === username.toLowerCase()
    );

    // Không tiết lộ tài khoản có tồn tại hay không - thông báo chung
    if (!foundAccount || foundAccount.password !== password) {
      const newCount = (attemptData.count || 0) + 1;
      let newLockedUntil = null;
      let alertMsg = `Tên đăng nhập hoặc mật khẩu không chính xác! (Lần sai: ${newCount}/5)`;

      if (newCount >= 5) {
        newLockedUntil = now + 15 * 60 * 1000; // Khóa tạm 15 phút
        alertMsg = 'Bạn đã nhập sai thông tin 5 lần liên tiếp! Tài khoản bị tạm khóa 15 phút để đảm bảo an toàn.';
      }

      localStorage.setItem(userKey, JSON.stringify({ count: newCount >= 5 ? 0 : newCount, lockedUntil: newLockedUntil }));

      setPopup({
        show: true,
        title: 'Đăng nhập thất bại',
        message: alertMsg,
        type: 'error',
        onConfirm: () => setPopup(p => ({ ...p, show: false }))
      });
      return;
    }

    // Đăng nhập thành công -> Xóa bộ đếm số lần sai
    localStorage.removeItem(userKey);

    if (foundAccount.isLocked) {
      setPopup({
        show: true,
        title: 'Tài khoản đã bị khóa',
        message: `Tài khoản này hiện đang bị khóa.\nLý do: "${foundAccount.lockReason || 'Không có'}"`,
        type: 'error',
        onConfirm: () => setPopup(p => ({ ...p, show: false }))
      });
      return;
    }

    setUser(foundAccount);
    setCurrentRole(foundAccount.role);
    localStorage.setItem('auth_user', JSON.stringify(foundAccount));
    setScreen('dashboard');
  }, [userList, setUser, setCurrentRole, setScreen, setPopup]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (onLoginSubmit) onLoginSubmit({ username: loginUsername, password: loginPassword });

    const trimmedUser = loginUsername.trim();
    if (!trimmedUser || !loginPassword) {
      setPopup({
        show: true,
        title: 'Đăng nhập không thành công',
        message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!',
        type: 'error',
        onConfirm: () => setPopup(p => ({ ...p, show: false }))
      });
      return;
    }

    doLogin(trimmedUser, loginPassword);
  };

  return (
    <form onSubmit={handleLoginSubmit} style={styles.formContainerResponsive}>
      <div style={styles.avatarCircle}>👤</div>
      <h3 style={styles.formTitle}>ĐĂNG NHẬP HỆ THỐNG</h3>

      {/* Username input */}
      <div
        style={{
          ...styles.inputWrapper,
          ...(hoveredBlock === 'inp-user' ? styles.elevatedInput3D : {}),
        }}
        onMouseEnter={() => setHoveredBlock('inp-user')}
        onMouseLeave={() => setHoveredBlock(null)}
      >
        <input
          type="text"
          placeholder="USERNAME"
          value={loginUsername}
          onChange={(e) => setLoginUsername(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* Password input */}
      <div
        style={{
          ...styles.inputWrapper,
          ...(hoveredBlock === 'inp-pass' ? styles.elevatedInput3D : {}),
        }}
        onMouseEnter={() => setHoveredBlock('inp-pass')}
        onMouseLeave={() => setHoveredBlock(null)}
      >
        <input
          type={showLoginPass ? 'text' : 'password'}
          placeholder="MẬT KHẨU"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          style={styles.inputWithEye}
        />
        <TogglePassBtn isVisible={showLoginPass} onToggle={() => setShowLoginPass(v => !v)} />
      </div>

      {/* Login button */}
      <button
        type="submit"
        style={{
          ...styles.actionBtn,
          ...(hoveredBlock === 'btn-login' ? styles.elevatedBtnNavy : {}),
        }}
        onMouseEnter={() => setHoveredBlock('btn-login')}
        onMouseLeave={() => setHoveredBlock(null)}
      >
        ĐĂNG NHẬP
      </button>

      {/* Bottom links */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '12px', marginTop: '8px' }}>
        <a
          href="#register"
          onClick={(e) => { e.preventDefault(); setScreen('register'); }}
          style={{ ...styles.linkText, textDecoration: 'none' }}
        >
          + Tạo tài khoản
        </a>
        <a
          href="#forgot"
          onClick={(e) => { e.preventDefault(); setScreen('forgot'); }}
          style={{ ...styles.linkText, textDecoration: 'none' }}
        >
          Quên mật khẩu?
        </a>
      </div>

      {/* === DEMO QUICK LOGIN (dưới form, nằm ngang) === */}
      <div style={{
        width: '100%',
        marginTop: '20px',
        padding: '14px',
        borderRadius: '14px',
        backgroundColor: '#f8fafc',
        border: '1px dashed #cbd5e1',
      }}>
        <p style={{
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#64748b',
          textAlign: 'center',
          marginBottom: '10px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}>
          ⚡ Đăng nhập nhanh Demo
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.username}
              type="button"
              onClick={() => doLogin(acc.username, acc.password)}
              onMouseEnter={() => setHoveredBlock(`demo-${acc.username}`)}
              onMouseLeave={() => setHoveredBlock(null)}
              style={{
                flex: '1 1 0',
                padding: '9px 6px',
                borderRadius: '20px',
                border: `1px solid ${acc.border}`,
                backgroundColor: hoveredBlock === `demo-${acc.username}` ? acc.color : acc.bg,
                color: hoveredBlock === `demo-${acc.username}` ? '#ffffff' : acc.color,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                transition: 'all 0.2s ease',
                transform: hoveredBlock === `demo-${acc.username}` ? 'translateY(-2px)' : 'none',
                boxShadow: hoveredBlock === `demo-${acc.username}` ? `0 4px 12px ${acc.color}44` : 'none',
                lineHeight: '1.3',
              }}
            >
              <span style={{ fontSize: '16px' }}>{acc.label.split(' ')[0]}</span>
              <span>{acc.label.split(' ').slice(1).join(' ')}</span>
              <span style={{ fontSize: '9px', opacity: 0.75, fontWeight: 'normal' }}>{acc.roleTitle}</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
};

export default Login;
