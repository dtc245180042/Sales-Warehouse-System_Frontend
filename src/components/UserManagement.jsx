import { useState, useMemo } from 'react';
import TogglePassBtn from './TogglePassBtn';
import LockAccountModal from './LockAccountModal';
import UnlockAccountModal from './UnlockAccountModal';
import { MIN_PASSWORD_LENGTH } from '../utils/constants';
import './UserManagement.css';

// Danh sách Vai trò chuẩn trong hệ thống OMS
const ROLE_OPTIONS = [
  { value: 'admin', title: 'Quản trị viên (Admin)', icon: '🛡️', badgeClass: 'admin' },
  { value: 'sales_mgr', title: 'Quản lý kinh doanh (Sales Manager)', icon: '💼', badgeClass: 'sales_mgr' },
  { value: 'sales_rep', title: 'Nhân viên kinh doanh (Sales Rep)', icon: '📱', badgeClass: 'sales_rep' },
  { value: 'wh_mgr', title: 'Quản lý kho (WH Manager)', icon: '🏬', badgeClass: 'wh_mgr' },
  { value: 'warehouse', title: 'Thủ kho (Warehouse Staff)', icon: '📦', badgeClass: 'warehouse' },
  { value: 'accountant', title: 'Kế toán (Accountant)', icon: '🧮', badgeClass: 'accountant' },
  { value: 'customer', title: 'Đại lý cấp 1 (Customer)', icon: '🏪', badgeClass: 'customer' },
];

const WAREHOUSE_LIST = [
  'Kho Tổng Hà Nội',
  'Kho Đà Nẵng',
  'Kho Cần Thơ',
  'Kho TP. Hồ Chí Minh'
];

export default function UserManagement({
  userList = [],
  setUserList,
  setPopup,
  currentUser
}) {
  // -------------------------------------------------------------------------
  // STATE TÌM KIẾM, LỌC VÀ PHÂN TRANG
  // -------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'locked'
  const [warehouseFilter, setWarehouseFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // -------------------------------------------------------------------------
  // STATE MODALS
  // -------------------------------------------------------------------------
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = mode Tạo mới, object = mode Sửa

  // Form State cho Tạo/Sửa
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'sales_rep',
    roleTitle: 'Nhân viên kinh doanh (Sales Rep)',
    warehouse: '',
    assignedAgenciesStr: '',
    isLocked: false,
    lockReason: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [formGeneralError, setFormGeneralError] = useState(null);
  const [duplicateFields, setDuplicateFields] = useState({ username: false, email: false, phone: false });
  const [showPassword, setShowPassword] = useState(false);

  // Modal Khóa Tài Khoản & Mở Khóa Tài Khoản (SCRUM-300 / SCRUM-344)
  const [lockModalTarget, setLockModalTarget] = useState(null);
  const [unlockModalTarget, setUnlockModalTarget] = useState(null);

  // Modal Reset Password
  const [resetPassTarget, setResetPassTarget] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetPassError, setResetPassError] = useState('');

  // Modal Delete User
  const [deleteTarget, setDeleteTarget] = useState(null);

  // -------------------------------------------------------------------------
  // LỌC VÀ PHÂN TRANG DỮ LIỆU (MEMOIZED)
  // -------------------------------------------------------------------------
  const filteredUsers = useMemo(() => {
    return userList.filter((u) => {
      // 1. Tìm kiếm theo từ khóa (Name, Username, Email, Phone)
      const term = searchTerm.trim().toLowerCase();
      const matchSearch = !term || (
        (u.fullName && u.fullName.toLowerCase().includes(term)) ||
        (u.username && u.username.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.phone && u.phone.includes(term))
      );

      // 2. Lọc theo Vai trò
      const matchRole = roleFilter === 'all' || u.role === roleFilter;

      // 3. Lọc theo Trạng thái (Hoạt động / Đã khóa)
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !u.isLocked) ||
        (statusFilter === 'locked' && u.isLocked);

      // 4. Lọc theo Kho
      const matchWarehouse =
        warehouseFilter === 'all' ||
        (warehouseFilter === 'none' && !u.warehouse) ||
        u.warehouse === warehouseFilter;

      return matchSearch && matchRole && matchStatus && matchWarehouse;
    });
  }, [userList, searchTerm, roleFilter, statusFilter, warehouseFilter]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = userList.length;
    const active = userList.filter(u => !u.isLocked).length;
    const locked = userList.filter(u => u.isLocked).length;
    return { total, active, locked };
  }, [userList]);

  // Phân trang
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, safeCurrentPage, itemsPerPage]);

  // Đổi trang hoặc đổi điều kiện lọc -> reset về trang 1 nếu vượt quá
  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setWarehouseFilter('all');
    setCurrentPage(1);
  };

  // -------------------------------------------------------------------------
  // MỞ FORM TẠO MỚI / SỬA TÀI KHOẢN
  // -------------------------------------------------------------------------
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      username: '',
      password: '',
      email: '',
      phone: '',
      role: 'sales_rep',
      roleTitle: 'Nhân viên kinh doanh (Sales Rep)',
      warehouse: '',
      assignedAgenciesStr: '',
      isLocked: false,
      lockReason: ''
    });
    setFormErrors({});
    setFormGeneralError(null);
    setDuplicateFields({ username: false, email: false, phone: false });
    setShowPassword(false);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      fullName: u.fullName || '',
      username: u.username || '',
      password: '', // Để trống nếu không muốn đổi pass
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'sales_rep',
      roleTitle: u.roleTitle || ROLE_OPTIONS.find(r => r.value === u.role)?.title || u.role,
      warehouse: u.warehouse || '',
      assignedAgenciesStr: Array.isArray(u.assignedAgencies) ? u.assignedAgencies.join(', ') : '',
      isLocked: !!u.isLocked,
      lockReason: u.lockReason || ''
    });
    setFormErrors({});
    setFormGeneralError(null);
    setDuplicateFields({ username: false, email: false, phone: false });
    setShowPassword(false);
    setIsFormModalOpen(true);
  };

  // Sinh mật khẩu ngẫu nhiên
  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pass }));
    setShowPassword(true);
  };

  // Handler khi đổi role trong Form
  const handleRoleSelect = (roleVal) => {
    const selectedObj = ROLE_OPTIONS.find(r => r.value === roleVal);
    setFormData(prev => ({
      ...prev,
      role: roleVal,
      roleTitle: selectedObj ? selectedObj.title : roleVal,
    }));
  };

  // -------------------------------------------------------------------------
  // VALIDATION FORM & KIỂM TRA TRÙNG LẶP DỮ LIỆU
  // -------------------------------------------------------------------------
  const validateForm = () => {
    const errors = {};
    const dupFlags = { username: false, email: false, phone: false };
    const detailsList = [];

    // 1. Họ và tên
    if (!formData.fullName.trim()) {
      errors.fullName = 'Họ và tên không được để trống';
      detailsList.push('Vui lòng nhập Họ và tên.');
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Họ và tên phải có tối thiểu 2 ký tự';
      detailsList.push('Họ và tên quá ngắn.');
    }

    // 2. Tên đăng nhập (Username) & Mật khẩu
    if (!editingUser) {
      // Tạo mới -> Validate Tên đăng nhập
      const inputUsername = formData.username.trim();
      if (!inputUsername) {
        errors.username = 'Tên đăng nhập không được để trống';
        detailsList.push('Tên đăng nhập (Username) bắt buộc nhập.');
      } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(inputUsername)) {
        errors.username = 'Username từ 3-20 ký tự, chỉ gồm chữ cái, số và dấu gạch dưới (_)';
        detailsList.push('Tên đăng nhập sai định dạng (chỉ cho phép chữ cái, số và _ từ 3-20 ký tự).');
      } else {
        // Kiểm tra TRÙNG USERNAME
        const dupUser = userList.find(u => u.username.toLowerCase() === inputUsername.toLowerCase());
        if (dupUser) {
          errors.username = `⚠️ Trùng lặp: Tên đăng nhập '${inputUsername}' đã thuộc về '${dupUser.fullName}'.`;
          dupFlags.username = true;
          detailsList.push(`Trùng Tên đăng nhập: Username '${inputUsername}' đã tồn tại trong hệ thống.`);
        }
      }

      // Tạo mới -> Validate Mật khẩu (SCRUM-201: Tối thiểu 8 ký tự)
      if (!formData.password) {
        errors.password = 'Mật khẩu là bắt buộc khi tạo tài khoản mới';
        detailsList.push('Vui lòng nhập mật khẩu đăng nhập.');
      } else if (formData.password.length < MIN_PASSWORD_LENGTH) {
        errors.password = `Mật khẩu phải có tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`;
        detailsList.push(`Mật khẩu quá ngắn (tối thiểu ${MIN_PASSWORD_LENGTH} ký tự).`);
      }
    } else {
      // Chỉnh sửa -> Validate Mật khẩu mới nếu có nhập (SCRUM-201: Tối thiểu 8 ký tự)
      if (formData.password && formData.password.length < MIN_PASSWORD_LENGTH) {
        errors.password = `Mật khẩu mới phải có tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`;
        detailsList.push(`Mật khẩu mới phải có tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`);
      }
    }

    // 3. Email (Validate định dạng & Kiểm tra TRÙNG LẶP Email khi Tạo HOẶC Sửa)
    const inputEmail = formData.email.trim();
    if (!inputEmail) {
      errors.email = 'Email không được để trống';
      detailsList.push('Địa chỉ Email không được để trống.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail)) {
      errors.email = 'Địa chỉ Email không đúng định dạng (ví dụ: name@company.com)';
      detailsList.push('Địa chỉ Email không đúng định dạng.');
    } else {
      // Kiểm tra TRÙNG EMAIL (ngoại trừ tài khoản của chính mình khi sửa)
      const dupEmailUser = userList.find(u =>
        u.email && u.email.toLowerCase() === inputEmail.toLowerCase() &&
        (!editingUser || u.username !== editingUser.username)
      );
      if (dupEmailUser) {
        errors.email = `⚠️ Trùng lặp: Email '${inputEmail}' đã được sử dụng bởi tài khoản @${dupEmailUser.username} (${dupEmailUser.fullName}).`;
        dupFlags.email = true;
        detailsList.push(`Trùng Email: Địa chỉ '${inputEmail}' đã được đăng ký cho người dùng '@${dupEmailUser.username}'.`);
      }
    }

    // 4. Số điện thoại (Validate định dạng & Kiểm tra TRÙNG LẶP SĐT khi Tạo HOẶC Sửa)
    const inputPhone = formData.phone.trim();
    if (inputPhone) {
      if (!/^[0-9]{10}$/.test(inputPhone)) {
        errors.phone = 'Số điện thoại phải gồm đúng 10 chữ số';
        detailsList.push('Số điện thoại không đúng 10 chữ số.');
      } else {
        // Kiểm tra TRÙNG SỐ ĐIỆN THOẠI (ngoại trừ tài khoản của chính mình khi sửa)
        const dupPhoneUser = userList.find(u =>
          u.phone && u.phone === inputPhone &&
          (!editingUser || u.username !== editingUser.username)
        );
        if (dupPhoneUser) {
          errors.phone = `⚠️ Trùng lặp: Số điện thoại '${inputPhone}' đã được đăng ký bởi tài khoản @${dupPhoneUser.username} (${dupPhoneUser.fullName}).`;
          dupFlags.phone = true;
          detailsList.push(`Trùng Số điện thoại: SĐT '${inputPhone}' đã thuộc về tài khoản '@${dupPhoneUser.username}'.`);
        }
      }
    }

    // 5. Ràng buộc Vai trò Kho & Địa bàn (Mandatory Warehouse & Assigned Agencies)
    if ((formData.role === 'wh_mgr' || formData.role === 'warehouse') && !formData.warehouse) {
      errors.warehouse = 'Bắt buộc chọn ít nhất một Kho phụ trách đối với vai trò Kho/Thủ kho';
      detailsList.push('Vai trò Thủ kho/Quản lý kho bắt buộc phải được gán ít nhất 1 kho cụ thể.');
    }

    if (formData.role === 'sales_rep' && !formData.assignedAgenciesStr.trim()) {
      errors.assignedAgenciesStr = 'Bắt buộc nhập ít nhất một địa bàn / đại lý phụ trách';
      detailsList.push('Vai trò NV Kinh doanh bắt buộc phải nhập địa bàn hoặc đại lý phụ trách.');
    }

    // 6. Chống tự thu hồi quyền Quản trị (Self-demotion protection)
    if (editingUser && editingUser.role === 'admin' && currentUser && currentUser.username === editingUser.username) {
      if (formData.role !== 'admin') {
        errors.role = '❌ Không thể tự thu hồi quyền Quản trị viên của chính mình!';
        detailsList.push('Quản trị viên không thể tự giáng cấp/thu hồi vai trò Admin của chính mình.');
      }
    }

    // 7. Lý do khóa tài khoản
    if (formData.isLocked && !formData.lockReason.trim()) {
      errors.lockReason = 'Bắt buộc ghi rõ lý do khi chọn khóa tài khoản';
      detailsList.push('Vui lòng nhập lý do khóa tài khoản.');
    }

    setFormErrors(errors);
    setDuplicateFields(dupFlags);

    if (detailsList.length > 0) {
      setFormGeneralError({
        summary: dupFlags.username || dupFlags.email || dupFlags.phone
          ? '⚠️ Không thể lưu: Dữ liệu tài khoản bị TRÙNG LẶP với người dùng khác trong hệ thống.'
          : '⚠️ Không thể lưu: Thông tin form chứa dữ liệu không hợp lệ hoặc vi phạm quy định phân quyền.',
        details: detailsList
      });
      return false;
    }

    setFormGeneralError(null);
    return true;
  };

  // Submit Tạo mới / Cập nhật người dùng
  const handleSubmitForm = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Phản hồi thất bại bằng Popup nếu bị trùng dữ liệu nghiêm trọng
      setPopup({
        show: true,
        title: '❌ Thao Tác Thất Bại',
        message: 'Không thể lưu tài khoản do thông tin bị trùng lặp hoặc không đúng định dạng. Vui lòng kiểm tra lại các trường được đánh dấu đỏ trên Form!',
        type: 'error',
        onConfirm: () => setPopup(p => ({ ...p, show: false }))
      });
      return;
    }

    const assignedAgenciesArr = formData.assignedAgenciesStr
      ? formData.assignedAgenciesStr.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    if (editingUser) {
      // CAP NHAT TAI KHOAN
      setUserList(prev => prev.map(u => {
        if (u.username === editingUser.username) {
          const updated = {
            ...u,
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            role: formData.role,
            roleTitle: formData.roleTitle,
            warehouse: formData.warehouse || null,
            assignedAgencies: formData.role === 'sales_rep' ? assignedAgenciesArr : undefined,
            isLocked: formData.isLocked,
            lockReason: formData.isLocked ? formData.lockReason.trim() : null
          };
          if (formData.password) {
            updated.password = formData.password;
          }
          return updated;
        }
        return u;
      }));

      setPopup({
        show: true,
        title: '✅ Cập Nhật Thành Công',
        message: `Hệ thống đã lưu thành công thông tin cập nhật cho tài khoản '@${editingUser.username}' (${formData.fullName.trim()}).`,
        type: 'success',
        onConfirm: () => setPopup(p => ({ ...p, show: false }))
      });
    } else {
      // TAO TAI KHOAN MOI
      const newUser = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        roleTitle: formData.roleTitle,
        warehouse: formData.warehouse || null,
        assignedAgencies: formData.role === 'sales_rep' ? assignedAgenciesArr : undefined,
        isLocked: formData.isLocked,
        lockReason: formData.isLocked ? formData.lockReason.trim() : null,
        createdAt: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      };

      setUserList(prev => [newUser, ...prev]);

      setPopup({
        show: true,
        title: '🎉 Tạo Tài Khoản Thành Công',
        message: `Tài khoản mới '@${newUser.username}' (${newUser.fullName} - ${newUser.roleTitle}) đã được tạo thành công và sẵn sàng hoạt động.`,
        type: 'success',
        onConfirm: () => setPopup(p => ({ ...p, show: false }))
      });
    }

    setIsFormModalOpen(false);
  };

  // -------------------------------------------------------------------------
  // XỬ LÝ KHÓA / MỞ KHÓA TÀI KHOẢN (LockAccountModal & UnlockAccountModal)
  // -------------------------------------------------------------------------
  const handleOpenLockModal = (u) => {
    if (u.role === 'admin') {
      alert("Không thể khóa tài khoản Admin gốc hệ thống!");
      return;
    }
    setLockModalTarget(u);
  };

  const handleConfirmLockAccount = (targetUsername, reason) => {
    const target = userList.find(u => u.username === targetUsername);
    let warningMsg = `Tài khoản '${targetUsername}' đã bị khóa và thu hồi toàn bộ phiên làm việc. Lý do: "${reason}".`;
    if (target && (target.role === 'sales_rep' || target.role === 'sales_mgr')) {
      warningMsg += `\n\n⚠️ CẢNH BÁO BÀN GIAO: Nhân sự này phụ trách danh sách đại lý địa bàn. Yêu cầu Quản trị viên phân công bàn giao ngay lập tức cho nhân viên khác!`;
    }

    setUserList(prev => prev.map(u => u.username === targetUsername ? { ...u, isLocked: true, lockReason: reason, lockedAt: new Date().toLocaleDateString('vi-VN') } : u));
    setLockModalTarget(null);

    setPopup({
      show: true,
      title: '🔒 Đã khóa tài khoản',
      message: warningMsg,
      type: 'info',
      onConfirm: () => setPopup(p => ({ ...p, show: false }))
    });
  };

  const handleOpenUnlockModal = (u) => {
    setUnlockModalTarget(u);
  };

  const handleConfirmUnlockAccount = (targetUsername) => {
    setUserList(prev => prev.map(item => item.username === targetUsername ? { ...item, isLocked: false, lockReason: null } : item));
    setUnlockModalTarget(null);
    setPopup({
      show: true,
      title: '🔓 Mở khóa thành công',
      message: `Tài khoản '${targetUsername}' đã được mở khóa và có thể đăng nhập bình thường.`,
      type: 'success',
      onConfirm: () => setPopup(p => ({ ...p, show: false }))
    });
  };

  // -------------------------------------------------------------------------
  // XỬ LÝ RESET MẬT KHẨU
  // -------------------------------------------------------------------------
  const handleOpenResetPassModal = (u) => {
    setResetPassTarget(u);
    setNewPasswordInput('');
    setShowNewPassword(false);
    setResetPassError('');
  };

  const handleConfirmResetPass = () => {
    if (!newPasswordInput) {
      setResetPassError('Vui lòng nhập hoặc tạo mật khẩu mới!');
      return;
    }
    if (newPasswordInput.length < MIN_PASSWORD_LENGTH) {
      setResetPassError(`Mật khẩu mới phải có tối thiểu ${MIN_PASSWORD_LENGTH} ký tự!`);
      return;
    }

    setUserList(prev => prev.map(u => u.username === resetPassTarget.username ? { ...u, password: newPasswordInput } : u));
    const targetUsername = resetPassTarget.username;
    setResetPassTarget(null);

    setPopup({
      show: true,
      title: '🔑 Reset Mật Khẩu Thành Công',
      message: `Mật khẩu mới cho tài khoản '${targetUsername}' đã được cập nhật thành: ${newPasswordInput}`,
      type: 'success',
      onConfirm: () => setPopup(p => ({ ...p, show: false }))
    });
  };

  // -------------------------------------------------------------------------
  // XỬ LÝ XÓA TÀI KHOẢN
  // -------------------------------------------------------------------------
  const handleOpenDeleteModal = (u) => {
    if (u.role === 'admin' && currentUser && currentUser.username === u.username) {
      alert("Bạn không thể tự xóa tài khoản Quản trị viên của chính mình!");
      return;
    }
    setDeleteTarget(u);
  };

  const handleConfirmDeleteUser = () => {
    if (!deleteTarget) return;
    const targetUser = deleteTarget;
    setUserList(prev => prev.filter(u => u.username !== targetUser.username));
    setDeleteTarget(null);

    setPopup({
      show: true,
      title: '🗑️ Xóa tài khoản thành công',
      message: `Tài khoản '${targetUser.username}' (${targetUser.fullName}) đã được xóa khỏi hệ thống.`,
      type: 'info',
      onConfirm: () => setPopup(p => ({ ...p, show: false }))
    });
  };

  // -------------------------------------------------------------------------
  // XUẤT DS NGƯỜI DÙNG RA CSV
  // -------------------------------------------------------------------------
  const handleExportCSV = () => {
    const headers = ['Họ và tên', 'Username', 'Email', 'Số điện thoại', 'Vai trò', 'Kho gán', 'Trạng thái', 'Lý do khóa', 'Ngày tạo'];
    const rows = filteredUsers.map(u => [
      `"${u.fullName || ''}"`,
      `"${u.username || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.roleTitle || u.role}"`,
      `"${u.warehouse || 'Không gán'}"`,
      `"${u.isLocked ? 'Đã khóa' : 'Hoạt động'}"`,
      `"${u.lockReason || ''}"`,
      `"${u.createdAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `danh_sach_tai_khoan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="um-container">
      {/* ------------------------------------------------------------------- */}
      {/* 1. KHO THỐNG KÊ THÔNG TIN (STAT CARDS) */}
      {/* ------------------------------------------------------------------- */}
      <div className="um-stats-grid">
        <div className="um-stat-card">
          <span className="stat-label">TỔNG TÀI KHOẢN</span>
          <div className="stat-value">{stats.total}</div>
          <span className="stat-desc">Tài khoản trong toàn hệ thống</span>
        </div>
        <div className="um-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="stat-label">ĐANG HOẠT ĐỘNG</span>
          <div className="stat-value" style={{ color: '#059669' }}>{stats.active}</div>
          <span className="stat-desc">Đang truy cập bình thường</span>
        </div>
        <div className="um-stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <span className="stat-label">TÀI KHOẢN BỊ KHÓA</span>
          <div className="stat-value" style={{ color: '#dc2626' }}>{stats.locked}</div>
          <span className="stat-desc">Yêu cầu lý do khi khóa</span>
        </div>
        <div className="um-stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <span className="stat-label">VAI TRÒ NGHIỆP VỤ</span>
          <div className="stat-value" style={{ color: '#2563eb' }}>{ROLE_OPTIONS.length}</div>
          <span className="stat-desc">Nhóm phân quyền chuẩn OMS</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. CHÍNH: BẢNG TÀI KHOẢN & TOOLBAR */}
      {/* ------------------------------------------------------------------- */}
      <div className="um-card">
        {/* Header Panel */}
        <div className="um-card-header">
          <div className="um-card-title-group">
            <h2>👥 Quản Lý Danh Sách & Phân Quyền Người Dùng</h2>
            <p>Xem danh sách, tìm kiếm, lọc vai trò, phân trang, tạo mới và cập nhật thông tin tài khoản hệ thống.</p>
          </div>
          <div className="um-header-actions">
            <button type="button" className="btn-secondary-export" onClick={handleExportCSV} title="Xuất dữ liệu danh sách đang xem ra file CSV">
              📥 Xuất CSV
            </button>
            <button type="button" className="btn-primary-add" onClick={handleOpenCreateModal}>
              ➕ Tạo tài khoản mới
            </button>
          </div>
        </div>

        {/* Toolbar Tìm kiếm & Bộ lọc */}
        <div className="um-filter-bar">
          <div className="um-search-box">
            <span className="um-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo Tên, Username, Email, Số điện thoại..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
            />
            {searchTerm && (
              <button type="button" className="um-search-clear" onClick={() => handleFilterChange(setSearchTerm, '')}>
                ✕
              </button>
            )}
          </div>

          {/* Lọc Vai trò */}
          <select
            className="um-filter-select"
            value={roleFilter}
            onChange={(e) => handleFilterChange(setRoleFilter, e.target.value)}
          >
            <option value="all">🎭 Tất cả Vai trò ({ROLE_OPTIONS.length})</option>
            {ROLE_OPTIONS.map(r => (
              <option key={r.value} value={r.value}>{r.icon} {r.title}</option>
            ))}
          </select>

          {/* Lọc Trạng thái */}
          <select
            className="um-filter-select"
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
          >
            <option value="all">⚡ Trạng thái: Tất cả</option>
            <option value="active">🟢 Hoạt động</option>
            <option value="locked">🔴 Đã khóa</option>
          </select>

          {/* Lọc Kho gán */}
          <select
            className="um-filter-select"
            value={warehouseFilter}
            onChange={(e) => handleFilterChange(setWarehouseFilter, e.target.value)}
          >
            <option value="all">🏢 Kho phụ trách: Tất cả</option>
            {WAREHOUSE_LIST.map(wh => (
              <option key={wh} value={wh}>{wh}</option>
            ))}
            <option value="none">Chưa gán kho</option>
          </select>

          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || warehouseFilter !== 'all') && (
            <button type="button" className="btn-reset-filters" onClick={handleResetFilters}>
              🔄 Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Bảng Danh sách Người Dùng */}
        <div className="um-table-wrapper">
          <table className="um-table">
            <thead>
              <tr>
                <th style={{ minWidth: '220px' }}>Họ và tên / Username</th>
                <th style={{ minWidth: '160px' }}>Liên hệ (Email / SĐT)</th>
                <th style={{ minWidth: '180px' }}>Vai trò nghiệp vụ</th>
                <th style={{ minWidth: '150px' }}>Kho phụ trách</th>
                <th style={{ minWidth: '110px' }}>Trạng thái</th>
                <th style={{ minWidth: '100px' }}>Ngày tạo</th>
                <th style={{ minWidth: '140px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                    <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>Không tìm thấy người dùng nào phù hợp</p>
                    <span style={{ fontSize: '12px' }}>Thử thay đổi từ khóa tìm kiếm hoặc điều kiện lọc</span>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const roleObj = ROLE_OPTIONS.find(r => r.value === u.role);
                  const avatarInitial = (u.fullName || u.username || 'U').trim().charAt(0).toUpperCase();

                  return (
                    <tr key={u.username}>
                      <td>
                        <div className="um-user-identity">
                          <div className="um-avatar">{avatarInitial}</div>
                          <div className="um-name-group">
                            <span className="um-fullname">{u.fullName}</span>
                            <span className="um-username">@{u.username}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                          <span style={{ color: '#0f172a', fontWeight: '500' }}>✉️ {u.email}</span>
                          <span style={{ color: '#64748b' }}>📞 {u.phone || 'Chưa cập nhật'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${roleObj ? roleObj.badgeClass : 'sales_rep'}`}>
                          {roleObj ? roleObj.icon : '👤'} {u.roleTitle || roleObj?.title || u.role}
                        </span>
                      </td>
                      <td>
                        {u.warehouse ? (
                          <span style={{ color: '#047857', fontWeight: '600', fontSize: '12px' }}>
                            🏢 {u.warehouse}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>-</span>
                        )}
                      </td>
                      <td>
                        {u.isLocked ? (
                          <span className="status-badge locked" title={`Lý do khóa: ${u.lockReason || 'Chưa rõ'}`}>
                            🔒 Đã khóa
                          </span>
                        ) : (
                          <span className="status-badge active">
                            🟢 Hoạt động
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {u.createdAt || '01/01/2026'}
                      </td>
                      <td>
                        <div className="um-actions-cell">
                          {/* Sửa thông tin */}
                          <button
                            type="button"
                            className="btn-icon-action edit"
                            onClick={() => handleOpenEditModal(u)}
                            title="Sửa thông tin tài khoản"
                          >
                            ✏️
                          </button>

                          {/* Reset mật khẩu */}
                          <button
                            type="button"
                            className="btn-icon-action reset"
                            onClick={() => handleOpenResetPassModal(u)}
                            title="Reset mật khẩu nhanh"
                          >
                            🔑
                          </button>

                          {/* Khóa / Mở khóa */}
                          {u.role === 'admin' ? (
                            <span style={{ fontSize: '11px', color: '#94a3b8', padding: '0 4px' }} title="Không thể tự khóa tài khoản Admin gốc">
                              Admin
                            </span>
                          ) : u.isLocked ? (
                            <button
                              type="button"
                              className="btn-icon-action unlock"
                              onClick={() => handleOpenUnlockModal(u)}
                              title="Mở khóa tài khoản"
                            >
                              🔓
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-icon-action lock"
                              onClick={() => handleOpenLockModal(u)}
                              title="Khóa tài khoản"
                            >
                              🔒
                            </button>
                          )}

                          {/* Xóa tài khoản */}
                          {u.role !== 'admin' && (
                            <button
                              type="button"
                              className="btn-icon-action delete"
                              onClick={() => handleOpenDeleteModal(u)}
                              title="Xóa tài khoản"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh Phân Trang (Pagination Controls) */}
        <div className="um-pagination">
          <div className="um-page-info">
            Hiển thị <strong>{filteredUsers.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1}</strong> - <strong>{Math.min(safeCurrentPage * itemsPerPage, filteredUsers.length)}</strong> trên tổng <strong>{filteredUsers.length}</strong> tài khoản
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Chọn số dòng hiển thị */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
              <span>Hiển thị:</span>
              <select
                className="um-filter-select"
                style={{ padding: '4px 8px', fontSize: '12px' }}
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
              </select>
            </div>

            {/* Các nút bấm chuyển trang */}
            <div className="um-page-controls">
              <button
                type="button"
                className="btn-page"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                ‹ Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`btn-page ${pageNum === safeCurrentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                className="btn-page"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Sau ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MODAL 1: FORM TẠO MỚI / SỬA NGƯỜI DÙNG */}
      {/* ------------------------------------------------------------------- */}
      {isFormModalOpen && (
        <div className="um-modal-overlay">
          <div className="um-modal-content">
            <div className="um-modal-header">
              <h3>{editingUser ? '✏️ Chỉnh Sửa Thông Tin Tài Khoản' : '➕ Tạo Tài Khoản Người Dùng Mới'}</h3>
              <button type="button" className="btn-modal-close" onClick={() => setIsFormModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="um-modal-body">
                {/* Thông báo lỗi tổng hợp & Lỗi trùng lặp dữ liệu */}
                {formGeneralError && (
                  <div className="um-alert-banner danger" style={{ marginBottom: '16px' }}>
                    <div className="alert-title">
                      <span>{formGeneralError.summary}</span>
                    </div>
                    {formGeneralError.details && formGeneralError.details.length > 0 && (
                      <ul>
                        {formGeneralError.details.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="form-grid-2">
                  {/* Họ và tên */}
                  <div className="form-group">
                    <label>Họ và tên <span className="required">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.fullName ? 'has-error' : ''}`}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                    {formErrors.fullName && <span className="field-error">{formErrors.fullName}</span>}
                  </div>

                  {/* Tên đăng nhập */}
                  <div className="form-group">
                    <label>Tên đăng nhập (Username) <span className="required">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.username ? 'has-error' : ''} ${duplicateFields.username ? 'is-duplicate' : ''}`}
                      placeholder="Ví dụ: sales_rep01"
                      value={formData.username}
                      disabled={!!editingUser} // Khóa username khi chỉnh sửa
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    />
                    {formErrors.username && <span className="field-error">{formErrors.username}</span>}
                    {editingUser && <span className="field-hint">Tên đăng nhập không thể thay đổi sau khi tạo</span>}
                  </div>
                </div>

                {/* Mật khẩu */}
                <div className="form-group">
                  <label>
                    {editingUser ? 'Mật khẩu mới (Để trống nếu không đổi)' : 'Mật khẩu đăng nhập '}
                    {!editingUser && <span className="required">*</span>}
                  </label>
                  <div className="pass-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control ${formErrors.password ? 'has-error' : ''}`}
                      placeholder={editingUser ? 'Nhập mật khẩu mới nếu muốn thay đổi...' : `Nhập mật khẩu (tối thiểu ${MIN_PASSWORD_LENGTH} ký tự)...`}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="btn-random-pass"
                      onClick={handleGenerateRandomPassword}
                      title="Sinh mật khẩu mạnh tự động"
                    >
                      🎲 Tự tạo
                    </button>
                    <TogglePassBtn
                      isVisible={showPassword}
                      onToggle={() => setShowPassword(p => !p)}
                    />
                  </div>
                  {formErrors.password && <span className="field-error">{formErrors.password}</span>}
                </div>

                <div className="form-grid-2">
                  {/* Email */}
                  <div className="form-group">
                    <label>Email liên hệ <span className="required">*</span></label>
                    <input
                      type="email"
                      className={`form-control ${formErrors.email ? 'has-error' : ''} ${duplicateFields.email ? 'is-duplicate' : ''}`}
                      placeholder="user@warehouse.local"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                    {formErrors.email && <span className="field-error">{formErrors.email}</span>}
                  </div>

                  {/* Số điện thoại */}
                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.phone ? 'has-error' : ''} ${duplicateFields.phone ? 'is-duplicate' : ''}`}
                      placeholder="0901234567"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                    {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
                  </div>
                </div>

                <div className="form-grid-2">
                  {/* Vai trò */}
                  <div className="form-group">
                    <label>Vai trò nghiệp vụ (Role) <span className="required">*</span></label>
                    <select
                      className={`form-control ${formErrors.role ? 'has-error' : ''}`}
                      value={formData.role}
                      onChange={(e) => handleRoleSelect(e.target.value)}
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r.value} value={r.value}>{r.icon} {r.title}</option>
                      ))}
                    </select>
                    {formErrors.role && <span className="field-error">{formErrors.role}</span>}
                  </div>

                  {/* Kho gán */}
                  <div className="form-group">
                    <label>Kho gán phụ trách {(formData.role === 'wh_mgr' || formData.role === 'warehouse') && <span className="required">*</span>}</label>
                    <select
                      className={`form-control ${formErrors.warehouse ? 'has-error' : ''}`}
                      value={formData.warehouse || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, warehouse: e.target.value }))}
                    >
                      <option value="">-- Không gán kho (Dùng cho Admin/Kế toán/Đại lý) --</option>
                      {WAREHOUSE_LIST.map(wh => (
                        <option key={wh} value={wh}>🏢 {wh}</option>
                      ))}
                    </select>
                    {formErrors.warehouse && <span className="field-error">{formErrors.warehouse}</span>}
                    {(formData.role === 'wh_mgr' || formData.role === 'warehouse') && !formData.warehouse && !formErrors.warehouse && (
                      <span className="field-hint" style={{ color: '#d97706' }}>💡 Khuyên dùng chọn Kho gán cụ thể cho vai trò Quản lý/Thủ kho</span>
                    )}
                  </div>
                </div>

                {/* Danh sách đại lý phụ trách (nếu là Sales Rep) */}
                {formData.role === 'sales_rep' && (
                  <div className="form-group">
                    <label>Danh sách đại lý phụ trách <span className="required">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.assignedAgenciesStr ? 'has-error' : ''}`}
                      placeholder="Ví dụ: Đại lý Minh Phát, Công ty Tuấn Phương (phân cách bằng dấu phẩy)"
                      value={formData.assignedAgenciesStr}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignedAgenciesStr: e.target.value }))}
                    />
                    {formErrors.assignedAgenciesStr ? (
                      <span className="field-error">{formErrors.assignedAgenciesStr}</span>
                    ) : (
                      <span className="field-hint">Phân cách tên các đại lý bằng dấu phẩy (,)</span>
                    )}
                  </div>
                )}

                {/* Trạng thái khóa tài khoản */}
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>🔒 Khóa quyền truy cập tài khoản này</strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Thu hồi phiên làm việc tức thì phía server nếu đang đăng nhập</p>
                    </div>
                    <input
                      type="checkbox"
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      checked={formData.isLocked}
                      onChange={(e) => setFormData(prev => ({ ...prev, isLocked: e.target.checked }))}
                    />
                  </div>

                  {formData.isLocked && (
                    <div className="form-group">
                      <label style={{ color: '#b91c1c' }}>Lý do khóa tài khoản <span className="required">*</span></label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.lockReason ? 'has-error' : ''}`}
                        placeholder="Nhập lý do khóa (Ví dụ: Tạm nghỉ việc, Vi phạm chính sách security...)"
                        value={formData.lockReason}
                        onChange={(e) => setFormData(prev => ({ ...prev, lockReason: e.target.value }))}
                      />
                      {formErrors.lockReason && <span className="field-error">{formErrors.lockReason}</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="um-modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsFormModalOpen(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-modal-submit">
                  {editingUser ? '💾 Lưu thay đổi' : '🎉 Tạo mới tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL 2: KHÓA TÀI KHOẢN (LockAccountModal) & MỞ KHÓA (UnlockAccountModal) */}
      {/* ------------------------------------------------------------------- */}
      <LockAccountModal
        isOpen={!!lockModalTarget}
        targetUser={lockModalTarget}
        onClose={() => setLockModalTarget(null)}
        onConfirmLock={handleConfirmLockAccount}
      />
      <UnlockAccountModal
        isOpen={!!unlockModalTarget}
        targetUser={unlockModalTarget}
        onClose={() => setUnlockModalTarget(null)}
        onConfirmUnlock={handleConfirmUnlockAccount}
      />

      {/* ------------------------------------------------------------------- */}
      {/* MODAL 3: RESET MẬT KHẨU NHANH */}
      {/* ------------------------------------------------------------------- */}
      {resetPassTarget && (
        <div className="um-modal-overlay">
          <div className="um-modal-content" style={{ maxWidth: '480px' }}>
            <div className="um-modal-header" style={{ backgroundColor: '#fffbeb' }}>
              <h3 style={{ color: '#92400e' }}>🔑 Đặt Lại Mật Khẩu: {resetPassTarget.username}</h3>
              <button type="button" className="btn-modal-close" onClick={() => setResetPassTarget(null)}>✕</button>
            </div>
            <div className="um-modal-body">
              <p style={{ fontSize: '13px', color: '#334155', margin: 0 }}>
                Đặt lại mật khẩu cho <strong>{resetPassTarget.fullName}</strong>. Người dùng sẽ phải sử dụng mật khẩu mới này ở lần đăng nhập tiếp theo.
              </p>

              <div className="form-group">
                <label>Mật khẩu mới <span className="required">*</span></label>
                <div className="pass-input-wrapper">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className={`form-control ${resetPassError ? 'has-error' : ''}`}
                    placeholder={`Nhập mật khẩu mới (tối thiểu ${MIN_PASSWORD_LENGTH} ký tự)...`}
                    value={newPasswordInput}
                    onChange={(e) => {
                      setNewPasswordInput(e.target.value);
                      if (e.target.value) setResetPassError('');
                    }}
                  />
                  <button
                    type="button"
                    className="btn-random-pass"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$';
                      let pass = '';
                      for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                      setNewPasswordInput(pass);
                      setShowNewPassword(true);
                      setResetPassError('');
                    }}
                  >
                    🎲 Tự tạo
                  </button>
                  <TogglePassBtn
                    isVisible={showNewPassword}
                    onToggle={() => setShowNewPassword(p => !p)}
                  />
                </div>
                {resetPassError && <span className="field-error">{resetPassError}</span>}
              </div>
            </div>
            <div className="um-modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setResetPassTarget(null)}>Hủy</button>
              <button type="button" className="btn-modal-submit" onClick={handleConfirmResetPass}>💾 Cập nhật Mật khẩu</button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL 4: XÁC NHẬN XÓA TÀI KHOẢN */}
      {/* ------------------------------------------------------------------- */}
      {deleteTarget && (
        <div className="um-modal-overlay">
          <div className="um-modal-content" style={{ maxWidth: '440px' }}>
            <div className="um-modal-header" style={{ backgroundColor: '#fff1f2' }}>
              <h3 style={{ color: '#be123c' }}>🗑️ Xác Nhận Xóa Tài Khoản</h3>
              <button type="button" className="btn-modal-close" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <div className="um-modal-body">
              <p style={{ fontSize: '14px', color: '#0f172a', margin: 0, lineHeight: '1.5' }}>
                Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản <strong>{deleteTarget.fullName}</strong> (<code>@{deleteTarget.username}</code>)?
              </p>
              <span style={{ fontSize: '12px', color: '#e11d48', fontWeight: '500' }}>
                ⚠️ Thao tác này không thể hoàn tác! Toàn bộ lịch sử liên kết tài khoản này có thể bị ảnh hưởng.
              </span>
            </div>
            <div className="um-modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button type="button" className="btn-modal-submit danger" onClick={handleConfirmDeleteUser}>🗑️ Xóa Vĩnh Viễn</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
