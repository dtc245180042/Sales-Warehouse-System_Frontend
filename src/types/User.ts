export type UserRole = 'Admin' | 'Manager' | 'Staff';

export type UserStatus = 'active' | 'inactive' | 'locked';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
  phone?: string;
  department?: string;
  lastLogin: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
