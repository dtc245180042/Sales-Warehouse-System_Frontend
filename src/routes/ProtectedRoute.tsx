import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/User';
import { Loading } from '../components/common/Loading';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../components/common/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading text="Đang xác thực thông tin đăng nhập..." fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Không có quyền truy cập</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mb-6">
          Tài khoản của bạn với vai trò <span className="font-semibold text-rose-600">{role}</span> không được phân quyền xem phân hệ này.
        </p>
        <Navigate to="/sales/pos" replace />
      </div>
    );
  }

  return <>{children}</>;
};
