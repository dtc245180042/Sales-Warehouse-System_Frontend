export type UserRole = 'Admin' | 'Manager' | 'Staff' | 'User';

export type UserStatus = 'active' | 'inactive' | 'locked';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  roles?: UserRole[];
  status: UserStatus;
  avatar: string;
  phone?: string;
  department?: string;
  warehouse?: string;
  territory?: string;
  assignedDealersCount?: number;
  lockReason?: string;
  lockedAt?: string;
  handoverTo?: string;
  lastLogin: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
