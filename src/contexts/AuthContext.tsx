import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/User';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string, remember?: boolean) => Promise<User>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  canAccess: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initialize currentUser from localStorage or initial user
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string, remember: boolean = true): Promise<User> => {
    setIsLoading(true);
    try {
      const loggedUser = await authService.login(email, pass, remember);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: UserRole) => {
    const switchedUser = authService.switchRole(newRole);
    setUser(switchedUser);
  };

  const role: UserRole = user?.role || 'Staff';
  const isAuthenticated = !!user;

  const canAccess = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        login,
        logout,
        switchRole,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
