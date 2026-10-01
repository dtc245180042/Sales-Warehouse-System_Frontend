import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Package,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  ShoppingCart,
  Receipt,
  Users2,
  Building2,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  ShieldCheck,
  Settings,
  ChevronDown,
  Warehouse,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/User';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  title: string;
  path?: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
  submenu?: {
    title: string;
    path: string;
    icon?: React.ReactNode;
    allowedRoles: UserRole[];
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onMobileClose,
  isCollapsed,
}) => {
  const { role } = useAuth();
  const location = useLocation();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    inventory: true,
    sales: true,
    reports: false,
  });

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const menuSections: { heading?: string; items: MenuItem[] }[] = [
    {
      items: [
        {
          title: 'Tổng quan Dashboard',
          path: '/dashboard',
          icon: <LayoutDashboard className="w-5 h-5" />,
          allowedRoles: ['Admin', 'Manager'],
        },
      ],
    },
    {
      heading: 'QUẢN LÝ HÀNG HÓA',
      items: [
        {
          title: 'Sản phẩm',
          path: '/products',
          icon: <Boxes className="w-5 h-5" />,
          allowedRoles: ['Admin', 'Manager'],
        },
        {
          title: 'Kho vận',
          icon: <Warehouse className="w-5 h-5" />,
          allowedRoles: ['Admin', 'Manager'],
          submenu: [
            { title: 'Tồn kho tổng hợp', path: '/inventory', icon: <Package className="w-4 h-4" />, allowedRoles: ['Admin', 'Manager'] },
            { title: 'Nhập kho', path: '/inventory/stock-in', icon: <ArrowDownLeft className="w-4 h-4" />, allowedRoles: ['Admin', 'Manager'] },
            { title: 'Xuất kho', path: '/inventory/stock-out', icon: <ArrowUpRight className="w-4 h-4" />, allowedRoles: ['Admin', 'Manager'] },
            { title: 'Lịch sử kho', path: '/inventory/history', icon: <History className="w-4 h-4" />, allowedRoles: ['Admin', 'Manager'] },
          ],
        },
      ],
    },
    {
      heading: 'BÁN HÀNG & POS',
      items: [
        {
          title: 'Điểm bán hàng (POS)',
          path: '/sales/pos',
          icon: <ShoppingCart className="w-5 h-5" />,
          allowedRoles: ['Admin', 'Manager', 'Staff'],
        },
        {
          title: 'Quản lý đơn hàng',
          path: '/orders',
          icon: <Receipt className="w-5 h-5" />,
          allowedRoles: ['Admin', 'Manager', 'Staff'],
        },
      ],
    },
    {
      heading: 'ĐỐI TÁC',
      items: [
        {
          title: 'Khách hàng',
          path: '/customers',
          icon: <Users2 className="w-5 h-5" />,
          allowedRoles: ['Admin', 'Manager', 'Staff'],
        },
        {
          title: 'Nhà cung cấp',
          path: '/suppliers',
          icon: <Building2 className="w-5 h-5" />,
          allowedRoles: ['Admin', 'Manager'],
        },
      ],
    },
    {
      heading: 'BÁO CÁO & THỐNG KÊ',
      items: [
        {
          title: 'Báo cáo',
          icon: <BarChart3 className="w-5 h-5" />,
          allowedRoles: ['Admin', 'Manager'],
          submenu: [
            { title: 'Báo cáo doanh thu', path: '/reports/revenue', icon: <TrendingUp className="w-4 h-4" />, allowedRoles: ['Admin', 'Manager'] },
            { title: 'Báo cáo bán hàng', path: '/reports/sales', icon: <FileSpreadsheet className="w-4 h-4" />, allowedRoles: ['Admin', 'Manager'] },
            { title: 'Báo cáo tồn kho', path: '/reports/inventory', icon: <Layers className="w-4 h-4" />, allowedRoles: ['Admin', 'Manager'] },
          ],
        },
      ],
    },
    {
      heading: 'HỆ THỐNG',
      items: [
        {
          title: 'Người dùng & Phân quyền',
          path: '/users',
          icon: <ShieldCheck className="w-5 h-5" />,
          allowedRoles: ['Admin'],
        },
        {
          title: 'Cài đặt hệ thống',
          path: '/settings',
          icon: <Settings className="w-5 h-5" />,
          allowedRoles: ['Admin', 'Manager'],
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <NavLink to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Warehouse className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div>
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                KhoVận Pro
              </span>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                OMS Enterprise
              </span>
            </div>
          )}
        </NavLink>
        {isMobileOpen && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {menuSections.map((section, idx) => {
          const visibleItems = section.items.filter((item) => item.allowedRoles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {section.heading && !isCollapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {section.heading}
                </p>
              )}
              {visibleItems.map((item, itemIdx) => {
                if (item.submenu) {
                  const isAnySubActive = item.submenu.some((sub) => location.pathname === sub.path);
                  const isSubOpen = openSubmenus[item.title.toLowerCase()] ?? isAnySubActive;

                  return (
                    <div key={itemIdx} className="space-y-1">
                      <button
                        onClick={() => toggleSubmenu(item.title.toLowerCase())}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          isAnySubActive
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <span className="shrink-0">{item.icon}</span>
                          {!isCollapsed && <span>{item.title}</span>}
                        </div>
                        {!isCollapsed && (
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isSubOpen ? 'rotate-180 text-indigo-500' : 'text-slate-400'
                            }`}
                          />
                        )}
                      </button>

                      {isSubOpen && !isCollapsed && (
                        <div className="pl-6 space-y-1 pt-1 border-l-2 border-slate-100 dark:border-slate-800 ml-5">
                          {item.submenu
                            .filter((sub) => sub.allowedRoles.includes(role))
                            .map((sub, sIdx) => (
                              <NavLink
                                key={sIdx}
                                to={sub.path}
                                onClick={onMobileClose}
                                className={({ isActive }) =>
                                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                    isActive
                                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
                                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                  }`
                                }
                              >
                                {sub.icon}
                                <span>{sub.title}</span>
                              </NavLink>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={itemIdx}
                    to={item.path!}
                    onClick={onMobileClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`
                    }
                    title={isCollapsed ? item.title : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!isCollapsed && <span>{item.title}</span>}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Role Badge Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Quyền truy cập:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                role === 'Admin'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                  : role === 'Manager'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
              }`}
            >
              {role}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 h-screen sticky top-0 transition-all duration-300 z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[85%] h-full z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
