import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Users,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  DollarSign,
  Download,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { formatCurrency } from '../../utils/formatters';
import { customerService } from '../../services/customerService';
import { Customer } from '../../types/Customer';
import { useToast } from '../../contexts/ToastContext';

export const CustomerList: React.FC = () => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    taxCode: '',
    customerGroup: 'Đại lý cấp 1',
    region: 'Miền Nam',
    assigneeId: '',
    phone: '',
    email: '',
    address: '',
    status: 'active' as 'active' | 'inactive',
  });

  const loadCustomers = async () => {
    const data = await customerService.getAll();
    setCustomers(data);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) => {
        const matchSearch =
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search) ||
          c.email.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase());
        const matchRegion = filterRegion === '' || c.region === filterRegion;
        const matchGroup = filterGroup === '' || c.customerGroup === filterGroup;
        const matchStatus = filterStatus === '' || c.status === filterStatus;
        const matchAssignee = filterAssignee === '' || (c.assigneeName && c.assigneeName.toLowerCase().includes(filterAssignee.toLowerCase()));
        return matchSearch && matchRegion && matchGroup && matchStatus && matchAssignee;
      }
    );
  }, [customers, search, filterRegion, filterGroup, filterStatus, filterAssignee]);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({ name: '', taxCode: '', customerGroup: 'Đại lý cấp 1', region: 'Miền Nam', assigneeId: '', phone: '', email: '', address: '', status: 'active' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      taxCode: c.taxCode || '',
      customerGroup: c.customerGroup || 'Đại lý cấp 1',
      region: c.region || 'Miền Nam',
      assigneeId: c.assigneeId || '',
      phone: c.phone,
      email: c.email,
      address: c.address,
      status: c.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast('Vui lòng nhập tên và số điện thoại khách hàng', 'warning');
      return;
    }

    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer.id, formData);
        showToast('Cập nhật thông tin khách hàng thành công!', 'success');
      } else {
        await customerService.create(formData);
        showToast('Thêm mới khách hàng thành công!', 'success');
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch {
      showToast('Có lỗi xảy ra', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const customerToDelete = customers.find(c => c.id === deleteId);
    if (customerToDelete && customerToDelete.totalOrders > 0) {
      showToast('Không thể xóa đại lý đã phát sinh giao dịch. Vui lòng chuyển sang Tạm ngưng.', 'error');
      setDeleteId(null);
      return;
    }
    try {
      await customerService.delete(deleteId);
      showToast('Đã xóa khách hàng', 'success');
      setDeleteId(null);
      loadCustomers();
    } catch {
      showToast('Lỗi khi xóa khách hàng', 'error');
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'code',
      header: 'Mã KH',
      sortable: true,
      className: 'font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap',
    },
    {
      key: 'name',
      header: 'Họ & Tên',
      sortable: true,
      className: 'min-w-[180px]',
      render: (c) => (
        <div>
          <Link
            to={`/customers/${c.id}`}
            className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 block truncate"
          >
            {c.name}
          </Link>
          <span className="text-xs text-slate-400 truncate block max-w-xs">{c.address}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Liên Hệ & MST',
      sortable: true,
      render: (c) => (
        <div className="text-xs space-y-0.5">
          <div className="font-semibold text-slate-800 dark:text-slate-200">{c.phone}</div>
          <div className="text-slate-400">{c.email}</div>
          {c.taxCode && <div className="text-slate-500 font-mono mt-1">MST: {c.taxCode}</div>}
        </div>
      ),
    },
    {
      key: 'customerGroup',
      header: 'Phân Loại',
      sortable: true,
      render: (c) => (
        <div className="text-xs space-y-0.5">
          <Badge variant="neutral" size="sm">{c.customerGroup || 'N/A'}</Badge>
          <div className="text-slate-500 mt-1">{c.region || 'Chưa phân vùng'}</div>
        </div>
      ),
    },
    {
      key: 'assignee',
      header: 'Người phụ trách',
      sortable: true,
      render: (c) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {c.assigneeName || 'Chưa gán'}
        </span>
      ),
    },
    {
      key: 'totalOrders',
      header: 'Đơn Hàng',
      sortable: true,
      render: (c) => <span className="font-bold text-slate-800 dark:text-slate-200">{c.totalOrders} đơn</span>,
    },
    {
      key: 'totalSpent',
      header: 'Tổng Chi Tiêu',
      sortable: true,
      render: (c) => (
        <span className="font-black text-indigo-600 dark:text-indigo-400">
          {formatCurrency(c.totalSpent)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      sortable: true,
      render: (c) => (
        <Badge variant={c.status === 'active' ? 'success' : 'neutral'} size="sm" dot>
          {c.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ngày Tham Gia',
      sortable: true,
      render: (c) => <span className="text-xs text-slate-400">{c.createdAt}</span>,
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/customers/${c.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleOpenEdit(c)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(c.id)}
            disabled={c.totalOrders > 0}
            className={`p-1.5 rounded-lg ${c.totalOrders > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'}`}
            title={c.totalOrders > 0 ? "Không thể xóa đại lý đã có giao dịch" : "Xóa"}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Quản Lý Khách Hàng"
      subtitle={`Theo dõi hồ sơ ${customers.length} khách hàng cá nhân và doanh nghiệp`}
      actions={
        <Button variant="primary" size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Thêm khách hàng
        </Button>
      }
    >
      <DataTable
        data={filteredCustomers}
        columns={columns}
        keyExtractor={(c) => c.id}
        filterComponent={
          <div className="flex flex-col gap-2 w-full max-w-4xl">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên, số điện thoại, email, mã KH..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="relative w-full sm:w-48">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  placeholder="Tìm người phụ trách..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tất cả khu vực</option>
                <option value="Miền Bắc">Miền Bắc</option>
                <option value="Miền Trung">Miền Trung</option>
                <option value="Miền Nam">Miền Nam</option>
              </select>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tất cả nhóm KH</option>
                <option value="Đại lý cấp 1">Đại lý cấp 1</option>
                <option value="Đại lý cấp 2">Đại lý cấp 2</option>
                <option value="Khách lẻ">Khách lẻ</option>
                <option value="Dự án">Dự án</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            </div>
          </div>
        }
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Chỉnh Sửa Thông Tin Khách Hàng' : 'Thêm Mới Khách Hàng'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Họ và tên / Tên công ty *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nguyễn Văn A / Công ty ABC"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mã số thuế
              </label>
              <input
                type="text"
                value={formData.taxCode}
                onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                placeholder="Ví dụ: 0312345678"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số điện thoại *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0901234567"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="customer@domain.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nhóm khách hàng
              </label>
              <select
                value={formData.customerGroup}
                onChange={(e) => setFormData({ ...formData, customerGroup: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Đại lý cấp 1">Đại lý cấp 1</option>
                <option value="Đại lý cấp 2">Đại lý cấp 2</option>
                <option value="Khách lẻ">Khách lẻ</option>
                <option value="Dự án">Dự án</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Khu vực
              </label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Miền Bắc">Miền Bắc</option>
                <option value="Miền Trung">Miền Trung</option>
                <option value="Miền Nam">Miền Nam</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Địa chỉ liên hệ
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Số nhà, đường, phường, quận, tỉnh thành"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {editingCustomer ? 'Lưu thay đổi' : 'Tạo khách hàng'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa khách hàng"
        message="Bạn có chắc chắn muốn xóa khách hàng này khỏi danh sách quản lý?"
        confirmText="Xóa khách hàng"
        variant="danger"
      />
    </PageContainer>
  );
};
