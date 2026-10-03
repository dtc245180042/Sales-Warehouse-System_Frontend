/* global process */
/**
 * KIỂM THỬ TỰ ĐỘNG SPRINT 2 - OMS Pro
 * User Story: SCRUM-210 (Xem và cập nhật hồ sơ cá nhân)
 * Subtasks:
 * - SCRUM-358: Kiểm tra và chuẩn hóa định dạng số điện thoại Việt Nam
 * - SCRUM-360: Ràng buộc bảo mật ngăn sửa tài khoản, vai trò, kho và địa bàn
 * - SCRUM-361: Màn hình hồ sơ cá nhân và form chỉnh sửa họ tên, số điện thoại
 */

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, code, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m [${code}]: ${message}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖ FAIL\x1b[0m [${code}]: ${message}`);
  }
}

function suite(title) {
  console.log(`\n\x1b[1m\x1b[34m━━━ ${title} ━━━\x1b[0m`);
}

// ========================================================
// 1. Phone validation logic (mirrored from src/utils/phoneUtils.ts)
// ========================================================
function normalizeVNPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/[\s.\-()]/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('84') && cleaned.length === 11) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
}

function isValidVNPhoneNumber(phone) {
  const cleaned = normalizeVNPhoneNumber(phone);
  const vnPhoneRegex = /^(03[2-9]|05[25689]|07[06-9]|08[1-9]|09[0-9])[0-9]{7}$/;
  return vnPhoneRegex.test(cleaned);
}

function validateVNPhoneNumber(phone) {
  if (!phone || !phone.trim()) {
    return { valid: false, message: 'Số điện thoại không được để trống.' };
  }
  const cleaned = normalizeVNPhoneNumber(phone);
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, message: 'Số điện thoại chỉ được chứa các chữ số.' };
  }
  if (cleaned.length !== 10) {
    return {
      valid: false,
      message: `Số điện thoại phải có đúng 10 chữ số (hiện tại có ${cleaned.length} số).`,
    };
  }
  if (!isValidVNPhoneNumber(cleaned)) {
    return {
      valid: false,
      message: 'Đầu số điện thoại không hợp lệ. Vui lòng nhập đầu số mạng Việt Nam (03, 05, 07, 08, 09).',
    };
  }
  return { valid: true, normalized: cleaned };
}

// ========================================================
// 2. Mock User & Profile Service (mirrored from src/services/authService.ts)
// ========================================================
const mockCurrentUser = {
  id: 'USR-002',
  name: 'Trần Thị Thu Trang',
  email: 'trang.sales@khovanpro.vn',
  role: 'SalesStaff',
  roles: ['SalesStaff'],
  status: 'active',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  phone: '0987654321',
  department: 'Kinh Doanh',
  territory: 'Miền Bắc',
  warehouse: 'Kho Tổng Hà Nội',
  lastLogin: '2026-10-03 14:20:00',
  createdAt: '2026-09-01',
};

function updateProfile(currentUser, data) {
  if (!currentUser) throw new Error('Chưa đăng nhập');
  const trimmedName = data.name ? data.name.trim() : '';
  if (!trimmedName || trimmedName.length < 2) {
    throw new Error('Họ và tên không được để trống (tối thiểu 2 ký tự).');
  }

  const phoneVal = validateVNPhoneNumber(data.phone);
  if (!phoneVal.valid) {
    throw new Error(phoneVal.message || 'Số điện thoại không hợp lệ.');
  }

  // BẢO MẬT: Bất kể input có cố tình truyền email, role, warehouse, territory hay không,
  // hệ thống tuyệt đối giữ nguyên từ currentUser:
  return {
    ...currentUser,
    name: trimmedName,
    phone: phoneVal.normalized,
    avatar: data.avatar || currentUser.avatar,
    // Không bị ghi đè:
    email: currentUser.email,
    role: currentUser.role,
    roles: currentUser.roles,
    warehouse: currentUser.warehouse,
    territory: currentUser.territory,
    id: currentUser.id,
    status: currentUser.status,
  };
}

console.log('\n══════════════════════════════════════════════════');
console.log('🚀 KIỂM THỬ TỰ ĐỘNG SPRINT 2 – SCRUM-210 & SCRUM-361');
console.log('══════════════════════════════════════════════════');

// ── TEST SUITE 1: SCRUM-358 / ĐỊNH DẠNG SĐT VIỆT NAM ─────
suite('SCRUM-358: Kiểm tra & chuẩn hóa định dạng số điện thoại Việt Nam');

assert(isValidVNPhoneNumber('0912345678'), 'TC-358-01', 'Đầu số 09 (Vinaphone/Mobifone/Viettel) hợp lệ');
assert(isValidVNPhoneNumber('0388889999'), 'TC-358-02', 'Đầu số 03 (Viettel) hợp lệ');
assert(isValidVNPhoneNumber('0701234567'), 'TC-358-03', 'Đầu số 07 (Mobifone) hợp lệ');
assert(isValidVNPhoneNumber('0891234567'), 'TC-358-04', 'Đầu số 08 (Vinaphone/Mobi) hợp lệ');
assert(isValidVNPhoneNumber('0561234567'), 'TC-358-05', 'Đầu số 05 (Vietnamobile) hợp lệ');

assert(isValidVNPhoneNumber('+84912345678'), 'TC-358-06', 'Định dạng quốc tế +84 được chấp nhận và chuẩn hóa');
assert(normalizeVNPhoneNumber('+84912345678') === '0912345678', 'TC-358-07', '+84912345678 chuẩn hóa thành 0912345678');
assert(normalizeVNPhoneNumber('091-234-5678') === '0912345678', 'TC-358-08', 'Dấu gạch ngang và khoảng trắng được tự động làm sạch');

assert(!isValidVNPhoneNumber('0123456789'), 'TC-358-09', 'Đầu số 01 (11 số cũ bị khai tử) bị từ chối');
assert(!isValidVNPhoneNumber('091234567'), 'TC-358-10', 'Thiếu số (9 chữ số) bị từ chối');
assert(!isValidVNPhoneNumber('09123456789'), 'TC-358-11', 'Thừa số (11 chữ số) bị từ chối');
assert(!isValidVNPhoneNumber('09123abc78'), 'TC-358-12', 'Chứa ký tự chữ cái bị từ chối');
assert(!isValidVNPhoneNumber(''), 'TC-358-13', 'Chuỗi rỗng bị từ chối với thông báo rõ ràng');

// ── TEST SUITE 2: SCRUM-361 / CẬP NHẬT HỒ SƠ CÁ NHÂN ──────
suite('SCRUM-361: Form chỉnh sửa hồ sơ cá nhân (Họ tên & Số điện thoại)');

const updatedValid = updateProfile(mockCurrentUser, {
  name: 'Trần Thu Trang Mới',
  phone: '0399112233',
});
assert(updatedValid.name === 'Trần Thu Trang Mới', 'TC-361-01', 'Cập nhật thành công họ và tên mới');
assert(updatedValid.phone === '0399112233', 'TC-361-02', 'Cập nhật thành công số điện thoại mới');

// Họ tên validation
try {
  updateProfile(mockCurrentUser, { name: '', phone: '0912345678' });
  assert(false, 'TC-361-03', 'Họ tên rỗng phải ném lỗi');
} catch (e) {
  assert(e.message.includes('Họ và tên không được để trống'), 'TC-361-03', 'Bắt lỗi họ tên rỗng: ' + e.message);
}

try {
  updateProfile(mockCurrentUser, { name: 'A', phone: '0912345678' });
  assert(false, 'TC-361-04', 'Họ tên dưới 2 ký tự phải ném lỗi');
} catch (e) {
  assert(e.message.includes('tối thiểu 2 ký tự'), 'TC-361-04', 'Bắt lỗi họ tên < 2 ký tự');
}

// SĐT validation khi cập nhật hồ sơ
try {
  updateProfile(mockCurrentUser, { name: 'Nguyễn Văn B', phone: '123456' });
  assert(false, 'TC-361-05', 'SĐT không hợp lệ phải ném lỗi');
} catch (e) {
  assert(e.message.includes('10 chữ số') || e.message.includes('không hợp lệ'), 'TC-361-05', 'Báo lỗi chi tiết khi SĐT sai');
}

// ── TEST SUITE 3: SCRUM-360 / BẢO MẬT & NGĂN TỰ ĐỔI THUỘC TÍNH HỆ THỐNG
suite('SCRUM-360: Ngăn chặn tự đổi tài khoản, vai trò, kho và địa bàn');

const attemptHackingProfile = updateProfile(mockCurrentUser, {
  name: 'Họ Tên Hợp Lệ',
  phone: '0912345678',
  email: 'hacker@evil.com',
  role: 'Admin',
  roles: ['Admin'],
  warehouse: 'Kho Bí Mật',
  territory: 'Toàn Cầu',
  status: 'inactive',
  id: 'USR-999',
});

assert(attemptHackingProfile.email === mockCurrentUser.email, 'TC-360-01', 'Tài khoản email KHÔNG bị thay đổi bởi người dùng');
assert(attemptHackingProfile.role === mockCurrentUser.role, 'TC-360-02', 'Vai trò (role) KHÔNG bị tự nâng quyền thành Admin');
assert(attemptHackingProfile.warehouse === mockCurrentUser.warehouse, 'TC-360-03', 'Kho phụ trách KHÔNG bị tự ý thay đổi');
assert(attemptHackingProfile.territory === mockCurrentUser.territory, 'TC-360-04', 'Địa bàn phụ trách KHÔNG bị tự ý thay đổi');
assert(attemptHackingProfile.id === mockCurrentUser.id, 'TC-360-05', 'ID định danh người dùng giữ nguyên');
assert(attemptHackingProfile.status === mockCurrentUser.status, 'TC-360-06', 'Trạng thái hoạt động tài khoản giữ nguyên');

console.log('\n══════════════════════════════════════════════════');
console.log(`📊 KẾT QUẢ: ${passedTests}/${totalTests} PASS | ${failedTests} FAIL`);
console.log(`📈 Tỷ lệ đạt: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
if (failedTests === 0) {
  console.log('🎉 TẤT CẢ TEST CASE SCRUM-210 / SCRUM-361 ĐẠT CHUẨN 100%!');
}
console.log('══════════════════════════════════════════════════\n');

process.exit(failedTests > 0 ? 1 : 0);
