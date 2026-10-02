import React, { useState, useEffect } from 'react';

const UserManagement = () => {
    // 1. Quản lý danh sách người dùng
    const [users, setUsers] = useState([
        { id: 1, name: 'NGUYEN VAN TOAN', email: 'toan@gmail.com', phone: '0901234567', role: 'NVKD', status: 'Hoạt động' },
        { id: 2, name: 'Tran Thi B', email: 'b.tran@gmail.com', phone: '0912345678', role: 'NVKD', status: 'Chờ kích hoạt' },
    ]);

    // 2. Bộ lọc & Tìm kiếm (SCRUM-322 / SCRUM-327)
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    // 3. Phân trang (SCRUM-205 - mặc định 20 dòng)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // 4. Modal & Form state (Tạo mới & Sửa)
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // Thông báo phản hồi/lỗi (SCRUM-328)
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'NVKD',
        status: 'Chờ kích hoạt',
    });

    // Reset form khi mở Modal tạo mới
    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({ name: '', email: '', phone: '', role: 'NVKD', status: 'Chờ kích hoạt' });
        setErrorMessage('');
        setShowModal(true);
    };

    // Mở Modal Sửa tài khoản
    const handleOpenEditModal = (user) => {
        setIsEditing(true);
        setEditId(user.id);
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
        });
        setErrorMessage('');
        setShowModal(true);
    };

    // Xử lý thay đổi Input
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Xử lý Submit Form (Tạo mới hoặc Sửa - SCRUM-327 & SCRUM-328)
    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        // Kiểm tra trùng lặp email hoặc SĐT (SCRUM-328 / SCRUM-325)
        const isDuplicate = users.some(
            (u) =>
                (u.email.toLowerCase() === formData.email.toLowerCase() || u.phone === formData.phone) &&
                (!isEditing || u.id !== editId)
        );

        if (isDuplicate) {
            setErrorMessage('Lỗi: Email hoặc Số điện thoại này đã tồn tại trong hệ thống!');
            return;
        }

        if (isEditing) {
            // Cập nhật người dùng
            setUsers(users.map((u) => (u.id === editId ? { ...u, ...formData } : u)));
            setSuccessMessage('Cập nhật thông tin tài khoản thành công!');
        } else {
            // Tạo người dùng mới
            const newUser = { id: users.length + 1, ...formData };
            setUsers([...users, newUser]);
            setSuccessMessage('Tạo tài khoản thành công! Email kích hoạt kèm mật khẩu tạm đã được gửi.');
        }

        setShowModal(false);

        // Tự ẩn thông báo thành công sau 4 giây
        setTimeout(() => setSuccessMessage(''), 4000);
    };

    // Logic lọc dữ liệu
    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone.includes(searchTerm);
        const matchesRole = selectedRole ? user.role === selectedRole : true;
        const matchesStatus = selectedStatus ? user.status === selectedStatus : true;
        return matchesSearch && matchesRole && matchesStatus;
    });

    // Logic phân trang (20 dòng/trang)
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="container my-4 p-4 bg-white rounded shadow-sm">
            <h3 className="mb-4 text-primary fw-bold">Quản Lý Tài Khoản Người Dùng</h3>

            {/* Thông báo thao tác thành công (SCRUM-328) */}
            {successMessage && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {successMessage}
                    <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
                </div>
            )}

            {/* 1. Thanh Lọc & Tìm Kiếm */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Tìm theo tên, tài khoản, số điện thoại..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="col-md-3">
                    <select className="form-select" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                        <option value="">-- Tất cả vai trò --</option>
                        <option value="NVKD">Nhân viên kinh doanh</option>
                        <option value="Admin">Quản trị viên</option>
                    </select>
                </div>
                <div className="col-md-3">
                    <select className="form-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                        <option value="">-- Tất cả trạng thái --</option>
                        <option value="Hoạt động">Hoạt động</option>
                        <option value="Chờ kích hoạt">Chờ kích hoạt</option>
                        <option value="Đã khóa">Đã khóa</option>
                    </select>
                </div>
                <div className="col-md-2 text-end">
                    <button className="btn btn-success w-100 fw-bold" onClick={handleOpenCreateModal}>
                        + Tạo Tài Khoản
                    </button>
                </div>
            </div>

            {/* 2. Bảng Danh Sách Tài Khoản */}
            <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle">
                    <thead className="table-dark">
                        <tr>
                            <th>STT</th>
                            <th>Họ và tên</th>
                            <th>Tài khoản (Email)</th>
                            <th>Số điện thoại</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th className="text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentUsers.length > 0 ? (
                            currentUsers.map((user, index) => (
                                <tr key={user.id}>
                                    <td>{indexOfFirstItem + index + 1}</td>
                                    <td className="fw-semibold">{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.phone}</td>
                                    <td><span className="badge bg-info text-dark">{user.role}</span></td>
                                    <td>
                                        <span className={`badge ${user.status === 'Hoạt động' ? 'bg-success' : user.status === 'Chờ kích hoạt' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleOpenEditModal(user)}>
                                            Sửa
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center text-muted">Không tìm thấy tài khoản phù hợp</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 3. Phân Trang (Mặc định 20 dòng) */}
            <div className="d-flex justify-content-between align-items-center mt-3">
                <span className="text-muted small">Hiển thị tối đa <b>20 dòng/trang</b></span>
                <nav>
                    <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Trước</button>
                        </li>
                        <li className="page-item active">
                            <button className="page-link">{currentPage}</button>
                        </li>
                        <li className={`page-item ${indexOfLastItem >= filteredUsers.length ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Sau</button>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* MODAL FORM TẠO / SỬA (SCRUM-327) */}
            {showModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">{isEditing ? 'Cập Nhật Tài Khoản' : 'Tạo Tài Khoản Mới'}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {/* Báo lỗi trùng tài khoản (SCRUM-328) */}
                                    {errorMessage && (
                                        <div className="alert alert-danger" role="alert">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <label className="form-label">Họ và tên</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-control"
                                            required
                                            placeholder="Nguyễn Văn A"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Email (Tài khoản)</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-control"
                                            required
                                            placeholder="nguyenvana@gmail.com"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Số điện thoại</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="form-control"
                                            required
                                            placeholder="0987654321"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Vai trò</label>
                                        <select name="role" className="form-select" value={formData.role} onChange={handleInputChange}>
                                            <option value="NVKD">Nhân viên kinh doanh</option>
                                            <option value="Admin">Quản trị viên</option>
                                        </select>
                                    </div>
                                    {isEditing && (
                                        <div className="mb-3">
                                            <label className="form-label">Trạng thái</label>
                                            <select name="status" className="form-select" value={formData.status} onChange={handleInputChange}>
                                                <option value="Hoạt động">Hoạt động</option>
                                                <option value="Chờ kích hoạt">Chờ kích hoạt</option>
                                                <option value="Đã khóa">Đã khóa</option>
                                            </select>
                                        </div>
                                    )}
                                    {!isEditing && (
                                        <p className="text-muted small">* Sau khi tạo, hệ thống sẽ gửi email kích hoạt kèm mật khẩu tạm.</p>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {isEditing ? 'Lưu Cập Nhật' : 'Xác Nhận Tạo'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;