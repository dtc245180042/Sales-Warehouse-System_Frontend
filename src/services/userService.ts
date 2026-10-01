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
    const newUser: User = {
      ...data,
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Chưa đăng nhập',
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

    const updated = { ...users[index], ...data };
    users[index] = updated;
    setStorageItem(STORAGE_KEY, [...users]);
    return updated;
  },

  toggleLock: async (id: string): Promise<User> => {
    await new Promise((r) => setTimeout(r, 200));
    const users = getStorageItem<User[]>(STORAGE_KEY, initialUsers);
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Không tìm thấy người dùng');

    const newStatus = users[index].status === 'locked' ? 'active' : 'locked';
    users[index] = { ...users[index], status: newStatus };
    setStorageItem(STORAGE_KEY, [...users]);
    return users[index];
  },

  delete: async (id: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 200));
    const users = getStorageItem<User[]>(STORAGE_KEY, initialUsers);
    const filtered = users.filter((u) => u.id !== id);
    setStorageItem(STORAGE_KEY, filtered);
    return true;
  }
};
