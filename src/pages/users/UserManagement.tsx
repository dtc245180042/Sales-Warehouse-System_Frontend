import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  ShieldCheck,
  Shield,
  UserCheck,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  Edit,
  Mail,
  Phone,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { userService } from '../../services/userService';
import { User, UserRole, UserStatus } from '../../types/User';
import { useToast } from '../../contexts/ToastContext';

export const UserManagement: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    role: 'Staff' as UserRole,
    status: 'active' as UserStatus,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  });

  const loadUsers = async () => {
    const data = await userService.getAll();
    setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.department && u.department.toLowerCase().includes(search.toLowerCase()));
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: 'Bán Hàng & POS',
      role: 'Staff',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      department: u.department || '',
      role: u.role,
      status: u.status,
      avatar: u.avatar,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Vui lòng nhập tên và email nhân viên', 'warning');
      return;
    }

    try {
      if (editingUser) {
        await userService.update(editingUser.id, formData);
        showToast('Cập nhật nhân viên thành công!', 'success');
      } else {
        await userService.create(formData);
        showToast('Tạo mới tài khoản nhân viên thành công!', 'success');
      }
      setIsModalOpen(false);
      loadUsers();
    } catch {
      showToast('Có lỗi xảy ra', 'error');
    }
  };

  const handleToggleLock = async (u: User) => {
    try {
      const updated = await userService.toggleLock(u.id);
      showToast(
        updated.status === 'locked' ? `Đã khóa tài khoản ${u.name}` : `Đã mở khóa cho ${u.name}`,
        'info'
      );
      loadUsers();
    } catch {
      showToast('Lỗi khi cập nhật trạng thái khóa', 'error');
    }
  };

  const handleResetPassword = (u: User) => {
    showToast(`Đã gửi mật khẩu mới tạm thời (Abc@123456) tới email ${u.email}`, 'success', 'Đặt lại mật khẩu');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await userService.delete(deleteId);
      showToast('Đã xóa người dùng khỏi hệ thống', 'success');
      setDeleteId(null);
      loadUsers();
    } catch {
      showToast('Lỗi khi xóa người dùng', 'error');
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Nhân Viên',
      sortable: true,
      className: 'min-w-[200px]',
      render: (u) => (
        <div className="flex items-center gap-3">
          <img
            src={u.avatar}
            alt={u.name}
            className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-indigo-500/20"
          />
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100">{u.name}</div>
            <span className="text-xs text-slate-400">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai Trò (Role)',
      sortable: true,
      render: (u) => {
        const roleMap = {
          Admin: { label: 'Admin (Quản trị tối cao)', variant: 'primary' as const },
          Manager: { label: 'Manager (Quản lý kho/bán)', variant: 'info' as const },
          Staff: { label: 'Staff (Nhân viên bán hàng)', variant: 'neutral' as const },
        };
        const conf = roleMap[u.role] || roleMap.Staff;
        return (
          <Badge variant={conf.variant} size="sm">
            {conf.label}
          </Badge>
        );
      },
    },
    {
      key: 'department',
      header: 'Phòng Ban',
      sortable: true,
      render: (u) => (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {u.department || 'Văn phòng'}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Số Điện Thoại',
      render: (u) => <span className="text-xs text-slate-500">{u.phone || '-'}</span>,
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      sortable: true,
      render: (u) => (
        <Badge
          variant={u.status === 'active' ? 'success' : u.status === 'locked' ? 'danger' : 'neutral'}
          size="sm"
          dot
        >
          {u.status === 'active' ? 'Hoạt động' : u.status === 'locked' ? 'Đã khóa' : 'Nghỉ phép'}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Đăng Nhập Gần Nhất',
      sortable: true,
      render: (u) => <span className="text-xs text-slate-400">{u.lastLogin}</span>,
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleResetPassword(u)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Đặt lại mật khẩu"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleLock(u)}
            className={`p-1.5 rounded-lg ${
              u.status === 'locked'
                ? 'text-rose-600 hover:bg-rose-50'
                : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100'
            }`}
            title={u.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
          >
            {u.status === 'locked' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleOpenEdit(u)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Chỉnh sửa quyền"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(u.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Xóa tài khoản"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Người Dùng & Phân Quyền Hệ Thống"
      subtitle={`Quản lý ${users.length} tài khoản nhân sự và phân bổ quyền thao tác nghiệp vụ`}
      actions={
        <Button variant="primary" size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Thêm người dùng mới
        </Button>
      }
    >
      <DataTable
        data={filteredUsers}
        columns={columns}
        keyExtractor={(u) => u.id}
        filterComponent={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên, email, phòng ban nhân viên..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
            </select>
          </div>
        }
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Chỉnh Sửa Người Dùng' : 'Tạo Tài Khoản Người Dùng Mới'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Họ và tên *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nguyễn Văn A"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email đăng nhập *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@khovanpro.vn"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912345678"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phân quyền (Role) *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Admin">Admin (Toàn quyền hệ thống)</option>
                <option value="Manager">Manager (Quản lý kho & bán)</option>
                <option value="Staff">Staff (Nhân viên quầy POS)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phòng ban
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Vận hành, Kế toán, POS..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Trạng thái hoạt động
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
              <option value="locked">Bị khóa tài khoản</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa tài khoản người dùng"
        message="Hành động này sẽ thu hồi quyền truy cập của nhân viên này vĩnh viễn."
        confirmText="Xóa tài khoản"
        variant="danger"
      />
    </PageContainer>
  );
};
