import { User, UserRole } from '../types/User';
import { initialUsers } from '../mock/users';
import { getStorageItem, setStorageItem, removeStorageItem } from './storage';
import { validateVNPhoneNumber } from '../utils/phoneUtils';

const STORAGE_KEYS = {
  CURRENT_USER: 'kv_current_user',
  AUTH_TOKEN: 'kv_auth_token',
  REMEMBER_EMAIL: 'kv_remember_email',
  USERS: 'kv_users',
};

export const authService = {
  initUsers: (): User[] => {
    let users = getStorageItem<User[]>(STORAGE_KEYS.USERS, initialUsers);
    
    // Sync: if the mock data has changed (e.g. we deleted users or added passwords), force sync
    if (users.length !== initialUsers.length || !users[0].password) {
      setStorageItem(STORAGE_KEYS.USERS, initialUsers);
      users = initialUsers;
    }
    
    return users;
  },

  getCurrentUser: (): User | null => {
    // SCRUM-198: Only return user if a valid auth token AND user session exist
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return null;
    const user = getStorageItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    return user;
  },

  login: async (email: string, password: string, remember: boolean = true): Promise<User> => {
    await new Promise((res) => setTimeout(res, 600)); // Simulate API latency
    const normalizedEmail = email.toLowerCase().trim();

    // Check failed attempts lock (15 minutes after 5 consecutive failures - SCRUM-198)
    const failedLogins = getStorageItem<Record<string, { count: number; lockedUntil: number }>>('kv_failed_logins', {});
    const record = failedLogins[normalizedEmail];
    if (record && record.lockedUntil > Date.now()) {
      const remainingMinutes = Math.ceil((record.lockedUntil - Date.now()) / 60000);
      throw new Error(`Tài khoản tạm thời bị khóa do nhập sai quá 5 lần liên tiếp. Vui lòng thử lại sau ${remainingMinutes} phút.`);
    }

    const users = authService.initUsers();
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    // Generic error message to prevent account enumeration
    if (!user || (user.password && user.password !== password)) {
      const currentCount = (record?.count || 0) + 1;
      if (currentCount >= 5) {
        failedLogins[normalizedEmail] = {
          count: currentCount,
          lockedUntil: Date.now() + 15 * 60 * 1000 // 15 mins lock
        };
        setStorageItem('kv_failed_logins', failedLogins);
        throw new Error('Bạn đã nhập sai 5 lần liên tiếp. Tài khoản tạm thời bị khóa 15 phút.');
      } else {
        failedLogins[normalizedEmail] = {
          count: currentCount,
          lockedUntil: 0
        };
        setStorageItem('kv_failed_logins', failedLogins);
        throw new Error('Email hoặc mật khẩu không chính xác.');
      }
    }

    // Check if account was locked by Admin (SCRUM-207)
    if (user.status === 'locked') {
      throw new Error('Tài khoản này đã bị khóa. Vui lòng liên hệ quản trị viên để mở khóa.');
    }

    // Reset failed count on success
    if (failedLogins[normalizedEmail]) {
      delete failedLogins[normalizedEmail];
      setStorageItem('kv_failed_logins', failedLogins);
    }

    setStorageItem(STORAGE_KEYS.CURRENT_USER, user);
    setStorageItem(STORAGE_KEYS.AUTH_TOKEN, `token-${Date.now()}`);

    if (remember) {
      setStorageItem(STORAGE_KEYS.REMEMBER_EMAIL, email);
    } else {
      removeStorageItem(STORAGE_KEYS.REMEMBER_EMAIL);
    }

    return user;
  },

  logout: async (): Promise<void> => {
    await new Promise((res) => setTimeout(res, 200));
    removeStorageItem(STORAGE_KEYS.CURRENT_USER);
    removeStorageItem(STORAGE_KEYS.AUTH_TOKEN);
    // SCRUM-199: Also clear session expiry timer on logout
    localStorage.removeItem('kv_session_expires_at');
  },

  switchRole: (role: UserRole): User => {
    const users = authService.initUsers();
    const targetUser = users.find((u) => u.role === role) || users[0];
    setStorageItem(STORAGE_KEYS.CURRENT_USER, targetUser);
    setStorageItem(STORAGE_KEYS.AUTH_TOKEN, `token-switch-${Date.now()}`);
    return targetUser;
  },

  changePassword: async (currentPassword: string, newPassword: string, revokeOtherSessions: boolean = true): Promise<void> => {
    await new Promise((res) => setTimeout(res, 500)); // Simulate API latency
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Bạn chưa đăng nhập vào hệ thống.');
    }

    if (!currentPassword) {
      throw new Error('Vui lòng nhập mật khẩu hiện tại.');
    }

    const users = authService.initUsers();
    const userIndex = users.findIndex((u) => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase());
    
    if (userIndex !== -1) {
      const dbUser = users[userIndex];
      if (dbUser.password && dbUser.password !== currentPassword) {
        throw new Error('Mật khẩu hiện tại không chính xác.');
      }
    }

    // Validation: min 8 chars, must contain both letters and digits
    if (newPassword.length < 8) {
      throw new Error('Mật khẩu mới phải có tối thiểu 8 ký tự.');
    }
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasDigit) {
      throw new Error('Mật khẩu mới phải bao gồm cả chữ cái và chữ số.');
    }

    if (newPassword === currentPassword) {
      throw new Error('Mật khẩu mới trùng với mật khẩu hiện tại.');
    }

    // Update in users storage
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      setStorageItem(STORAGE_KEYS.USERS, users);
    }

    // Update current user
    const updatedUser = { ...currentUser, password: newPassword };
    setStorageItem(STORAGE_KEYS.CURRENT_USER, updatedUser);

    if (revokeOtherSessions) {
      // Revoke other active sessions by rotating the auth token timestamp
      const freshToken = `token-fresh-${Date.now()}`;
      setStorageItem(STORAGE_KEYS.AUTH_TOKEN, freshToken);
      setStorageItem('kv_revoked_sessions_at', new Date().toISOString());
    }
  },

  updateProfile: async (data: { name: string; phone: string; avatar?: string }): Promise<User> => {
    await new Promise((res) => setTimeout(res, 300)); // Simulate API latency
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Bạn chưa đăng nhập vào hệ thống.');
    }

    const trimmedName = data.name ? data.name.trim() : '';
    if (!trimmedName || trimmedName.length < 2) {
      throw new Error('Họ và tên không được để trống (tối thiểu 2 ký tự).');
    }

    const phoneValidation = validateVNPhoneNumber(data.phone);
    if (!phoneValidation.valid) {
      throw new Error(phoneValidation.message || 'Số điện thoại không hợp lệ.');
    }

    const users = authService.initUsers();
    const userIndex = users.findIndex(
      (u) => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()
    );

    // SCRUM-210 & SCRUM-360: Giữ nguyên các trường hệ thống không được phép tự đổi:
    // email, role, roles, warehouse, territory, status, id
    const updatedUser: User = {
      ...currentUser,
      name: trimmedName,
      phone: phoneValidation.normalized || data.phone.trim(),
      ...(data.avatar ? { avatar: data.avatar } : {}),
    };

    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        name: trimmedName,
        phone: phoneValidation.normalized || data.phone.trim(),
        ...(data.avatar ? { avatar: data.avatar } : {}),
      };
      setStorageItem(STORAGE_KEYS.USERS, users);
    }

    setStorageItem(STORAGE_KEYS.CURRENT_USER, updatedUser);
    return updatedUser;
  },

  getRememberedEmail: (): string => {
    return getStorageItem<string>(STORAGE_KEYS.REMEMBER_EMAIL, 'admin@khovanpro.vn');
  }
};
