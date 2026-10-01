import { User } from '../types/User';

export const initialUsers: User[] = [
  {
    id: 'USR-001',
    name: 'Admin',
    email: 'admin@khovanpro.vn',
    password: 'admin@1234',
    role: 'Admin',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '0901234567',
    department: 'Ban Giám Đốc',
    lastLogin: '2026-10-01 08:30',
    createdAt: '2025-01-10',
  },
  {
    id: 'USR-002',
    name: 'Manager',
    email: 'manager@khovanpro.vn',
    password: 'manager@1234',
    role: 'Manager',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    phone: '0912345678',
    department: 'Vận Hành & Kho',
    lastLogin: '2026-10-01 09:15',
    createdAt: '2025-02-15',
  },
  {
    id: 'USR-003',
    name: 'Staff',
    email: 'staff@khovanpro.vn',
    password: 'staff@1234',
    role: 'Staff',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '0987654321',
    department: 'Bán Hàng & POS',
    lastLogin: '2026-10-01 10:00',
    createdAt: '2025-03-01',
  }
];
