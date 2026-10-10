import { Agent } from '../types/Agent';
import { initialAgents } from '../mock/agents';
import { getStorageItem, setStorageItem } from './storage';

const STORAGE_KEY = 'kv_agents';

export const agentService = {
  getAll: async (): Promise<Agent[]> => {
    return getStorageItem<Agent[]>(STORAGE_KEY, initialAgents);
  },

  getById: async (id: string): Promise<Agent | undefined> => {
    const agents = getStorageItem<Agent[]>(STORAGE_KEY, initialAgents);
    return agents.find((a) => a.id === id || a.code === id);
  },

  create: async (
    data: Omit<Agent, 'id' | 'createdAt' | 'totalOrders' | 'totalSpent' | 'outstandingDebt'> & { code?: string }
  ): Promise<Agent> => {
    const agents = getStorageItem<Agent[]>(STORAGE_KEY, initialAgents);
    const cleanCode = (data.code && data.code.trim())
      ? data.code.trim().toUpperCase()
      : `DL-${1000 + agents.length + 1}`;

    const existing = agents.find((a) => a.code.trim().toUpperCase() === cleanCode);
    if (existing) {
      throw new Error(`Mã đại lý "${cleanCode}" đã tồn tại trên hệ thống. Vui lòng nhập mã khác.`);
    }

    const newAgent: Agent = {
      ...data,
      id: `AGT-${String(agents.length + 1).padStart(3, '0')}`,
      code: cleanCode,
      totalOrders: 0,
      totalSpent: 0,
      outstandingDebt: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setStorageItem(STORAGE_KEY, [newAgent, ...agents]);
    return newAgent;
  },

  update: async (id: string, data: Partial<Agent>): Promise<Agent> => {
    const agents = getStorageItem<Agent[]>(STORAGE_KEY, initialAgents);
    const index = agents.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Không tìm thấy đại lý');

    if (data.code) {
      const cleanCode = data.code.trim().toUpperCase();
      const existing = agents.find(
        (a) => a.id !== id && a.code.trim().toUpperCase() === cleanCode
      );
      if (existing) {
        throw new Error(`Mã đại lý "${cleanCode}" đã được sử dụng bởi đại lý khác.`);
      }
      data.code = cleanCode;
    }

    const updated = { ...agents[index], ...data };
    agents[index] = updated;
    setStorageItem(STORAGE_KEY, [...agents]);
    return updated;
  },

  delete: async (id: string): Promise<boolean> => {
    const agents = getStorageItem<Agent[]>(STORAGE_KEY, initialAgents);
    const target = agents.find((a) => a.id === id);
    if (target && (target.totalOrders > 0 || target.totalSpent > 0)) {
      throw new Error(
        `Đại lý "${target.name}" (${target.code}) đã phát sinh ${target.totalOrders} đơn hàng, không thể xóa để bảo toàn dữ liệu giao dịch. Vui lòng chuyển sang Ngừng giao dịch.`
      );
    }
    setStorageItem(STORAGE_KEY, agents.filter((a) => a.id !== id));
    return true;
  },

  deactivate: async (id: string): Promise<Agent> => {
    return agentService.update(id, { status: 'inactive' });
  },
};
