import { User } from '../types/User';
import { initialUsers } from '../mock/users';
import { getStorageItem, setStorageItem } from './storage';

const STORAGE_KEY = 'kv_users';

export const userService = {
  getAll: async (): Promise<User[]> => {
    await new Promise((r) => setTimeout(r, 200));
    return getStorageItem<User[]>(STORAGE_KEY, initialUsers);
  },

  create: async (data: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<User> => {
    await new Promise((r) => setTimeout(r, 300));
    const users = getStorageItem<User[]>(STORAGE_KEY, initialUsers);
    
    // SCRUM-205: Duplicate check with specific message
    const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase().trim());
    if (existing) {
      throw new Error(`Email "${data.email}" đã tồn tại trong hệ thống. Vui lòng nhập email khác.`);
    }

    const newUser: User = {
      ...data,
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Chưa đăng nhập (Chờ kích hoạt)',
    };
    const updated = [...users, newUser];
    setStorageItem(STORAGE_KEY, updated);
    return newUser;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    await new Promise((r) => setTimeout(r, 200));
    const users = getStorageItem<User[]>(STORAGE_KEY, initialUsers);
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Không tìm thấy người dùng');

    // Duplicate email check when updating
    if (data.email) {
      const duplicate = users.find((u) => u.id !== id && u.email.toLowerCase() === data.email!.toLowerCase().trim());
      if (duplicate) {
        throw new Error(`Email "${data.email}" đã được sử dụng bởi nhân viên khác.`);
      }
    }

    const updated = { ...users[index], ...data };
    users[index] = updated;
    setStorageItem(STORAGE_KEY, [...users]);
    return updated;
  },

  lockAccount: async (id: string, reason: string, handoverTo?: string): Promise<User> => {
    await new Promise((r) => setTimeout(r, 200));
    if (!reason.trim()) {
      throw new Error('Bắt buộc phải ghi rõ lý do khóa tài khoản.');
    }
    const users = getStorageItem<User[]>(STORAGE_KEY, initialUsers);
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Không tìm thấy người dùng');

    const updated: User = {
      ...users[index],
      status: 'locked',
      lockReason: reason.trim(),
      lockedAt: new Date().toLocaleString('vi-VN'),
      handoverTo: handoverTo || undefined
    };
    users[index] = updated;
    setStorageItem(STORAGE_KEY, [...users]);

    // SCRUM-207: Revoke active session if this user is currently logged in
    const currentUser = getStorageItem<User | null>('kv_current_user', null);
    if (currentUser && currentUser.id === id) {
      localStorage.removeItem('kv_current_user');
      localStorage.removeItem('kv_auth_token');
    }

    return updated;
  },

  unlockAccount: async (id: string): Promise<User> => {
    await new Promise((r) => setTimeout(r, 200));
    const users = getStorageItem<User[]>(STORAGE_KEY, initialUsers);
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Không tìm thấy người dùng');

    users[index] = {
      ...users[index],
      status: 'active',
      lockReason: undefined,
      lockedAt: undefined,
      handoverTo: undefined
    };
    setStorageItem(STORAGE_KEY, [...users]);
    return users[index];
  },

  // SCRUM-207: toggleLock() removed - always use lockAccount(id, reason) to enforce mandatory reason
  // and unlockAccount(id) for unlock. This ensures audit trail compliance.

  delete: async (id: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 200));
    const users = getStorageItem<User[]>(STORAGE_KEY, initialUsers);
    const filtered = users.filter((u) => u.id !== id);
    setStorageItem(STORAGE_KEY, filtered);
    return true;
  }
};
