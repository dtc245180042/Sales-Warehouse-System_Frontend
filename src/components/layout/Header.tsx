import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  LogOut,
  Settings,
  User as UserIcon,
  ChevronDown,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { Breadcrumb } from './Breadcrumb';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { UserRole } from '../../types/User';

interface HeaderProps {
  onToggleMobile: () => void;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobile,
  onToggleCollapse,
}) => {
  const { user, role, logout, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Cảnh báo tồn kho', msg: 'Pin Sạc Dự Phòng Anker 737 đã hết hàng', time: '10 phút trước', unread: true },
    { id: '2', title: 'Đơn hàng mới', msg: 'Đơn hàng DH-2026-001 trị giá 32.180.000₫ vừa tạo', time: '25 phút trước', unread: true },
    { id: '3', title: 'Nhập kho thành công', msg: 'Phiếu PNK-2026-001 (50 sp) đã hoàn tất', time: '1 giờ trước', unread: false },
  ]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleLogout = async () => {
    showToast('Đã đăng xuất khỏi hệ thống thành công. Hẹn gặp lại!', 'info', 'Đăng xuất thành công');
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between transition-colors">
        {/* Left: Hamburger & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Đóng / Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Breadcrumb />
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher for easy testing! */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Shield className="w-3.5 h-3.5 ml-1.5 text-indigo-500" />
            <span className="text-[11px] text-slate-400 mr-1">Role:</span>
            {(['Admin', 'Manager', 'Staff'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`px-2 py-1 rounded-lg transition-all text-xs ${
                  role === r
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Search Button / Trigger */}
          <div className="relative hidden xl:block w-48">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm nhanh..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-indigo-500 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition-all"
            />
          </div>

          {/* Theme switch */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-600" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Thông báo"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-ping" />
              )}
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-slide-up">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Thông báo</h4>
                  <button
                    onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Đánh dấu đã đọc
                  </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-start gap-3 ${
                        n.unread ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {n.title.includes('tồn kho') ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{n.msg}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                  {user?.name || 'Người dùng'}
                </div>
                <div className="text-[10px] font-medium text-slate-400 capitalize">
                  {role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-slide-up">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Cài đặt tài khoản</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/users');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>Danh sách nhân viên</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Confirm Logout Dialog */}
      <ConfirmDialog
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Đăng xuất tài khoản"
        message="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống KhoVận Pro không?"
        confirmText="Đăng xuất"
        variant="danger"
      />
    </>
  );
};
