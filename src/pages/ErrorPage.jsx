import { useState, useEffect } from 'react';

// ============================================================
// CẤU HÌNH 4 LOẠI LỖI PHÂN BIỆT RÕ RÀNG
// ============================================================
const ERROR_CONFIGS = {
  404: {
    code: '404',
    title: 'Không Tìm Thấy Trang',
    subtitle: 'Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.',
    detail: 'URL có thể đã bị nhập sai, trang bị xóa, hoặc đường dẫn đã thay đổi.',
    icon: '🗺️',
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
    accentColor: '#3b82f6',
    accentBg: 'rgba(59, 130, 246, 0.12)',
    accentBorder: 'rgba(59, 130, 246, 0.35)',
    codeColor: '#60a5fa',
  },
  403: {
    code: '403',
    title: 'Không Đủ Quyền Truy Cập',
    subtitle: 'Tài khoản của bạn không có quyền xem nội dung này.',
    detail: 'Tính năng này chỉ dành cho một số vai trò nhất định. Hãy liên hệ Quản trị viên nếu bạn cần được cấp quyền.',
    icon: '🔒',
    gradient: 'linear-gradient(135deg, #3b1f1f 0%, #0f172a 100%)',
    accentColor: '#ef4444',
    accentBg: 'rgba(239, 68, 68, 0.12)',
    accentBorder: 'rgba(239, 68, 68, 0.35)',
    codeColor: '#f87171',
  },
  401: {
    code: '401',
    title: 'Phiên Đăng Nhập Không Hợp Lệ',
    subtitle: 'Phiên làm việc của bạn đã hết hạn hoặc không còn hiệu lực.',
    detail: 'Vì lý do bảo mật, hệ thống tự động đăng xuất sau một thời gian không hoạt động. Vui lòng đăng nhập lại để tiếp tục.',
    icon: '⏱️',
    gradient: 'linear-gradient(135deg, #1f2f3b 0%, #0f172a 100%)',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245, 158, 11, 0.12)',
    accentBorder: 'rgba(245, 158, 11, 0.35)',
    codeColor: '#fbbf24',
  },
  500: {
    code: '500',
    title: 'Lỗi Hệ Thống',
    subtitle: 'Đã xảy ra sự cố không mong muốn từ phía máy chủ.',
    detail: 'Đội kỹ thuật đã được thông báo và đang xử lý. Vui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ.',
    icon: '⚙️',
    gradient: 'linear-gradient(135deg, #1f2937 0%, #0f172a 100%)',
    accentColor: '#8b5cf6',
    accentBg: 'rgba(139, 92, 246, 0.12)',
    accentBorder: 'rgba(139, 92, 246, 0.35)',
    codeColor: '#a78bfa',
  },
};

// ============================================================
// COMPONENT CHÍNH
// ============================================================
const ErrorPage = ({
  errorType = 404,
  userRole = null,
  onGoHome,
  onGoBack,
  onLogin,
  onRetry,
}) => {
  const config = ERROR_CONFIGS[errorType] || ERROR_CONFIGS[404];
  const [visible, setVisible] = useState(false);
  const [dots, setDots] = useState('');

  // Hiệu ứng fade-in khi mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Hiệu ứng chấm động cho lỗi 500 (đang xử lý...)
  useEffect(() => {
    if (errorType !== 500) return;
    const interval = setInterval(() => {
      setDots(d => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, [errorType]);

  const styles = {
    container: {
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: config.gradient,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '24px',
      boxSizing: 'border-box',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    },
    card: {
      maxWidth: '520px',
      width: '100%',
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${config.accentBorder}`,
      borderRadius: '24px',
      padding: '48px 40px',
      textAlign: 'center',
      boxShadow: `0 25px 60px rgba(0,0,0,0.5)`,
      position: 'relative',
      overflow: 'hidden',
    },
    glow: {
      position: 'absolute',
      top: '-60px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      background: config.accentBg,
      filter: 'blur(60px)',
      pointerEvents: 'none',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: config.accentBg,
      border: `1px solid ${config.accentBorder}`,
      borderRadius: '20px',
      padding: '4px 14px',
      fontSize: '11px',
      color: config.codeColor,
      fontWeight: '700',
      marginBottom: '20px',
      letterSpacing: '0.5px',
    },
    icon: {
      fontSize: '52px',
      marginBottom: '8px',
      display: 'block',
    },
    errorCode: {
      fontSize: '96px',
      fontWeight: '900',
      color: config.codeColor,
      lineHeight: 1,
      marginBottom: '8px',
      letterSpacing: '-4px',
    },
    title: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#f1f5f9',
      margin: '12px 0 8px',
    },
    subtitle: {
      fontSize: '14px',
      color: '#94a3b8',
      lineHeight: '1.6',
      marginBottom: '16px',
    },
    detailBox: {
      background: config.accentBg,
      border: `1px solid ${config.accentBorder}`,
      borderRadius: '12px',
      padding: '12px 16px',
      fontSize: '13px',
      color: '#cbd5e1',
      lineHeight: '1.7',
      marginBottom: '28px',
      textAlign: 'left',
    },
    roleBox: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '12px',
      color: '#94a3b8',
      marginBottom: '20px',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    btnPrimary: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: '100%',
      padding: '13px 20px',
      borderRadius: '30px',
      border: 'none',
      background: config.accentColor,
      color: '#ffffff',
      fontWeight: '700',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginBottom: '10px',
      boxShadow: `0 6px 20px ${config.accentColor}44`,
      fontFamily: 'inherit',
    },
    btnSecondary: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: '100%',
      padding: '11px 20px',
      borderRadius: '30px',
      border: '1px solid rgba(255,255,255,0.12)',
      background: 'rgba(255,255,255,0.05)',
      color: '#94a3b8',
      fontWeight: '600',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
    },
    footer: {
      fontSize: '11px',
      color: '#475569',
      marginTop: '24px',
      marginBottom: 0,
    },
  };

  // Action buttons tùy loại lỗi
  const renderActions = () => {
    if (errorType === 401) {
      return (
        <>
          <button type="button" style={styles.btnPrimary} onClick={onLogin}>
            🔐 Đăng nhập lại
          </button>
          <button type="button" style={styles.btnSecondary} onClick={onGoHome}>
            🏠 Về trang chủ
          </button>
        </>
      );
    }
    if (errorType === 403) {
      return (
        <>
          <button type="button" style={styles.btnPrimary} onClick={onGoHome}>
            🏠 Về Dashboard của tôi
          </button>
          <button type="button" style={styles.btnSecondary} onClick={onGoBack}>
            ← Quay lại trang trước
          </button>
        </>
      );
    }
    if (errorType === 500) {
      return (
        <>
          <button type="button" style={styles.btnPrimary} onClick={onRetry}>
            🔄 Thử lại{dots}
          </button>
          <button type="button" style={styles.btnSecondary} onClick={onGoHome}>
            🏠 Về Dashboard
          </button>
        </>
      );
    }
    // 404
    return (
      <>
        <button type="button" style={styles.btnPrimary} onClick={onGoHome}>
          🏠 Về Dashboard
        </button>
        <button type="button" style={styles.btnSecondary} onClick={onGoBack}>
          ← Quay lại
        </button>
      </>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Glow nền */}
        <div style={styles.glow} />

        {/* Badge HTTP status */}
        <div style={styles.badge}>
          HTTP &nbsp;·&nbsp; Lỗi {config.code}
        </div>

        {/* Icon */}
        <span style={styles.icon}>{config.icon}</span>

        {/* Mã số to */}
        <div style={styles.errorCode}>{config.code}</div>

        {/* Tiêu đề */}
        <h1 style={styles.title}>{config.title}</h1>

        {/* Mô tả ngắn */}
        <p style={styles.subtitle}>{config.subtitle}</p>

        {/* Chi tiết */}
        <div style={styles.detailBox}>
          💡 {config.detail}
        </div>

        {/* Thông tin role nếu lỗi 403 */}
        {errorType === 403 && userRole && (
          <div style={styles.roleBox}>
            <span>👤</span>
            <span>
              Vai trò hiện tại: <strong style={{ color: config.codeColor }}>{userRole}</strong> — không đủ quyền cho tính năng này.
            </span>
          </div>
        )}

        {/* Nút hành động */}
        {renderActions()}

        {/* Footer */}
        <p style={styles.footer}>
          OMS Pro &nbsp;·&nbsp; Liên hệ hỗ trợ:{' '}
          <span style={{ color: config.codeColor }}>support@oms.local</span>
        </p>
      </div>
    </div>
  );
};

export default ErrorPage;
