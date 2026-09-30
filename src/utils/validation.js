/**
 * Kiểm tra các quy tắc nghiệp vụ khi gán vai trò và kho/địa bàn cho người dùng.
 * 
 * Quy tắc:
 * 1. Phải chọn ít nhất 1 vai trò.
 * 2. Vô hiệu hóa/Không cho phép tự thu hồi vai trò Quản trị viên của chính mình.
 * 3. Khi người dùng chọn được 1 kho HOẶC 1 địa bàn thì KHÔNG hiện cảnh báo nữa (trừ Quản trị viên được miễn gán).
 *    Chỉ cảnh báo khi KHÔNG có kho nào VÀ KHÔNG có địa bàn nào.
 * 4. Nếu có vai trò "Quản lý kho", bắt buộc phải gán ít nhất 1 kho hàng.
 * 5. Nếu có vai trò "Nhân viên bán hàng", bắt buộc phải gán ít nhất 1 địa bàn.
 */
export function validateUserAssignment({
  roles = [],
  warehouses = [],
  territories = [],
  isSelf = false,
  originalRoles = [],
}) {
  const errors = [];
  const warnings = [];

  const isAdmin = roles.includes('Quản trị viên');
  const wasAdmin = originalRoles.includes('Quản trị viên');

  // Quy tắc 1: Không được tự thu hồi vai trò Quản trị viên của chính mình
  if (isSelf && wasAdmin && !isAdmin) {
    errors.push('Không thể tự thu hồi vai trò Quản trị viên của chính mình để tránh mất quyền quản trị.');
  }

  // Quy tắc 2: Phải chọn ít nhất 1 vai trò
  if (roles.length === 0) {
    errors.push('Vui lòng chọn ít nhất một vai trò cho người dùng.');
  }

  // Quy tắc 3: Kiểm tra phạm vi kho hoặc địa bàn (Trừ Quản trị viên)
  // Khi chọn được ít nhất 1 kho HOẶC 1 địa bàn -> KHÔNG cảnh báo nữa!
  const hasScope = warehouses.length > 0 || territories.length > 0;
  if (!isAdmin && !hasScope) {
    warnings.push(
      'Người dùng chưa được gán kho hàng hoặc địa bàn phụ trách. Trừ Quản trị viên, người dùng cần được gán ít nhất 1 kho hoặc 1 địa bàn.'
    );
  }

  // Quy tắc 4: Quản lý kho bắt buộc phải có ít nhất 1 kho
  if (roles.includes('Quản lý kho') && warehouses.length === 0) {
    errors.push('Người dùng có vai trò Quản lý kho bắt buộc phải được gán ít nhất một kho hàng.');
  }

  // Quy tắc 5: Nhân viên bán hàng bắt buộc phải có ít nhất 1 địa bàn
  if (roles.includes('Nhân viên bán hàng') && territories.length === 0) {
    errors.push('Người dùng có vai trò Nhân viên bán hàng bắt buộc phải được gán ít nhất một địa bàn.');
  }

  // Nếu không phải Quản trị viên và hoàn toàn chưa có cả kho lẫn địa bàn -> không thể lưu
  if (!isAdmin && roles.length > 0 && !hasScope) {
    errors.push('Người dùng cần được gán ít nhất một kho hàng hoặc một địa bàn phụ trách (chỉ Quản trị viên mới được miễn gán).');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasScopeWarning: !isAdmin && !hasScope,
  };
}
