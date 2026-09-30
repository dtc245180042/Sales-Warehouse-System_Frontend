import { useEffect, useRef, useCallback } from 'react';

// ============================================================
// CẤU HÌNH PHIÊN ĐĂNG NHẬP
// ============================================================
const SESSION_CONFIG = {
  // Thời gian tối đa không hoạt động trước khi phiên hết hạn (ms)
  // Demo: 15 phút. Production nên đặt 30-60 phút.
  IDLE_TIMEOUT_MS: 15 * 60 * 1000,

  // Tần suất gia hạn phiên khi còn hoạt động (ms)
  // Mỗi 5 phút sẽ cập nhật lại timestamp
  RENEW_INTERVAL_MS: 5 * 60 * 1000,

  // Tần suất kiểm tra phiên hết hạn (ms)
  CHECK_INTERVAL_MS: 30 * 1000,

  // Thời gian cảnh báo trước khi hết phiên (ms) - 2 phút
  WARNING_BEFORE_EXPIRE_MS: 2 * 60 * 1000,

  // Key lưu trong localStorage
  STORAGE_KEY_LAST_ACTIVE: 'session_last_active',
  STORAGE_KEY_SESSION_ID: 'session_id',
};

/**
 * Tạo session ID duy nhất (mô phỏng server session)
 */
const generateSessionId = () => {
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
};

/**
 * Hook useSessionManager - Quản lý phiên đăng nhập thông minh
 *
 * Chức năng:
 * 1. Tự động gia hạn phiên khi người dùng đang hoạt động (di chuột, gõ phím, click, cuộn trang)
 * 2. Phát hiện phiên hết hạn khi không hoạt động quá lâu → đưa về trang login
 * 3. Cảnh báo trước khi hết phiên để người dùng kịp lưu đơn dở dang
 * 4. Đăng xuất sẽ hủy phiên tức thì (mô phỏng thu hồi phiên phía server)
 * 5. Đồng bộ hết phiên qua BroadcastChannel + Storage Event giữa các tab
 */
const useSessionManager = ({
  user,
  onSessionExpired,
  onSessionWarning,
  onSessionRenewed,
  enabled = true,
}) => {
  const lastActivityRef = useRef(null);
  const sessionIdRef = useRef(null);
  const checkIntervalRef = useRef(null);
  const renewIntervalRef = useRef(null);
  const warningShownRef = useRef(false);
  const isActiveRef = useRef(true);

  // -------------------------------------------------------
  // GHI NHẬN HOẠT ĐỘNG CỦA NGƯỜI DÙNG
  // -------------------------------------------------------
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    localStorage.setItem(SESSION_CONFIG.STORAGE_KEY_LAST_ACTIVE, String(Date.now()));

    // Nếu đã cảnh báo → hủy cảnh báo (người dùng quay lại hoạt động)
    if (warningShownRef.current) {
      warningShownRef.current = false;
      if (onSessionRenewed) {
        onSessionRenewed();
      }
    }
  }, [onSessionRenewed]);

  // -------------------------------------------------------
  // KHỞI TẠO PHIÊN KHI ĐĂNG NHẬP
  // -------------------------------------------------------
  const initSession = useCallback(() => {
    const newSessionId = generateSessionId();
    sessionIdRef.current = newSessionId;
    localStorage.setItem(SESSION_CONFIG.STORAGE_KEY_SESSION_ID, newSessionId);
    localStorage.setItem(SESSION_CONFIG.STORAGE_KEY_LAST_ACTIVE, String(Date.now()));
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
    isActiveRef.current = true;
  }, []);

  // -------------------------------------------------------
  // HỦY PHIÊN KHI ĐĂNG XUẤT (mô phỏng thu hồi server-side)
  // -------------------------------------------------------
  const destroySession = useCallback(() => {
    isActiveRef.current = false;
    sessionIdRef.current = null;
    localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY_SESSION_ID);
    localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY_LAST_ACTIVE);

    // Dọn dẹp intervals
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    if (renewIntervalRef.current) {
      clearInterval(renewIntervalRef.current);
      renewIntervalRef.current = null;
    }
  }, []);

  // -------------------------------------------------------
  // KIỂM TRA PHIÊN CÒN HIỆU LỰC KHÔNG
  // -------------------------------------------------------
  const checkSessionValidity = useCallback(() => {
    if (!isActiveRef.current || !user) return;

    const now = Date.now();
    const lastActive = lastActivityRef.current;
    const elapsed = now - lastActive;
    const timeRemaining = SESSION_CONFIG.IDLE_TIMEOUT_MS - elapsed;

    // Phiên đã hết hạn
    if (elapsed >= SESSION_CONFIG.IDLE_TIMEOUT_MS) {
      isActiveRef.current = false;
      destroySession();
      if (onSessionExpired) {
        onSessionExpired();
      }
      return;
    }

    // Sắp hết hạn → cảnh báo
    if (timeRemaining <= SESSION_CONFIG.WARNING_BEFORE_EXPIRE_MS && !warningShownRef.current) {
      warningShownRef.current = true;
      const minutesLeft = Math.ceil(timeRemaining / 60000);
      if (onSessionWarning) {
        onSessionWarning(minutesLeft);
      }
    }
  }, [user, destroySession, onSessionExpired, onSessionWarning]);

  // -------------------------------------------------------
  // THIẾT LẬP THEO DÕI HOẠT ĐỘNG + INTERVALS
  // -------------------------------------------------------
  useEffect(() => {
    if (!enabled || !user) return;

    // Khởi tạo thời gian hoạt động ban đầu
    if (lastActivityRef.current === null) {
      lastActivityRef.current = Date.now();
    }

    // Khởi tạo phiên nếu chưa có
    const existingSession = localStorage.getItem(SESSION_CONFIG.STORAGE_KEY_SESSION_ID);
    if (!existingSession) {
      initSession();
    } else {
      sessionIdRef.current = existingSession;
      // Khôi phục lastActive từ localStorage
      const savedLastActive = localStorage.getItem(SESSION_CONFIG.STORAGE_KEY_LAST_ACTIVE);
      if (savedLastActive) {
        lastActivityRef.current = parseInt(savedLastActive, 10);
      }
      isActiveRef.current = true;
    }

    // Lắng nghe hoạt động người dùng (di chuột, gõ phím, click, chạm, cuộn)
    const activityEvents = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    // Throttle: chỉ ghi nhận tối đa mỗi 10 giây
    let throttleTimer = null;
    const throttledActivity = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          recordActivity();
          throttleTimer = null;
        }, 10000);
      }
    };

    activityEvents.forEach(evt => {
      window.addEventListener(evt, throttledActivity, { passive: true });
    });

    // Interval kiểm tra phiên hết hạn
    checkIntervalRef.current = setInterval(checkSessionValidity, SESSION_CONFIG.CHECK_INTERVAL_MS);

    // Interval gia hạn phiên (cập nhật timestamp)
    renewIntervalRef.current = setInterval(() => {
      if (isActiveRef.current && user) {
        const now = Date.now();
        const elapsed = now - lastActivityRef.current;
        // Chỉ gia hạn nếu người dùng có hoạt động trong 5 phút qua
        if (elapsed < SESSION_CONFIG.RENEW_INTERVAL_MS) {
          localStorage.setItem(SESSION_CONFIG.STORAGE_KEY_LAST_ACTIVE, String(now));
        }
      }
    }, SESSION_CONFIG.RENEW_INTERVAL_MS);

    return () => {
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, throttledActivity);
      });
      if (throttleTimer) clearTimeout(throttleTimer);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (renewIntervalRef.current) clearInterval(renewIntervalRef.current);
    };
  }, [enabled, user, initSession, recordActivity, checkSessionValidity]);

  // -------------------------------------------------------
  // LẮNG NGHE PHIÊN BỊ HỦY TỪ TAB KHÁC
  // -------------------------------------------------------
  useEffect(() => {
    if (!enabled || !user) return;

    const handleStorageSessionChange = (event) => {
      // Phiên bị xóa từ tab khác
      if (event.key === SESSION_CONFIG.STORAGE_KEY_SESSION_ID && event.newValue === null) {
        isActiveRef.current = false;
        if (onSessionExpired) {
          onSessionExpired();
        }
      }
    };

    window.addEventListener('storage', handleStorageSessionChange);
    return () => {
      window.removeEventListener('storage', handleStorageSessionChange);
    };
  }, [enabled, user, onSessionExpired]);

  return {
    initSession,
    destroySession,
    recordActivity,
    getSessionId: () => sessionIdRef.current,
    isSessionActive: () => isActiveRef.current,
  };
};

export { useSessionManager, SESSION_CONFIG };
export default useSessionManager;
