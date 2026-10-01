import { User } from '../types/User';
import { initialUsers } from '../mock/users';
import { getStorageItem, setStorageItem, removeStorageItem } from './storage';

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
    const user = getStorageItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (!user) {
      // Default to Admin user so system is immediately testable if not logged in
      const defaultUser = initialUsers[0];
      setStorageItem(STORAGE_KEYS.CURRENT_USER, defaultUser);
      setStorageItem(STORAGE_KEYS.AUTH_TOKEN, 'demo-token-123456');
      return defaultUser;
    }
    return user;
  },

  login: async (email: string, password: string, remember: boolean = true): Promise<User> => {
    await new Promise((res) => setTimeout(res, 600)); // Simulate API latency
    const users = authService.initUsers();
    
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error('Email không tồn tại trong hệ thống.');
    }

    if (user.password && user.password !== password) {
      throw new Error('Mật khẩu không chính xác.');
    }

    if (user.status === 'locked') {
      throw new Error('Tài khoản đã bị tạm khóa. Vui lòng liên hệ quản trị viên.');
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
  },

  switchRole: (role: 'Admin' | 'Manager' | 'Staff'): User => {
    const users = authService.initUsers();
    const targetUser = users.find((u) => u.role === role) || users[0];
    setStorageItem(STORAGE_KEYS.CURRENT_USER, targetUser);
    return targetUser;
  },

  getRememberedEmail: (): string => {
    return getStorageItem<string>(STORAGE_KEYS.REMEMBER_EMAIL, 'admin@khovanpro.vn');
  }
};
