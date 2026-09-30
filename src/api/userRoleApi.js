import { INITIAL_USERS, WAREHOUSES_LIST, TERRITORIES_LIST } from '../utils/assignmentData';

/**
 * Mock API service cho màn hình gán vai trò & kho/địa bàn (Frontend mock)
 */
export const userRoleApi = {
  // Lấy danh sách người dùng
  async getUsers() {
    return Promise.resolve([...INITIAL_USERS]);
  },

  // Lấy chi tiết phân quyền của người dùng
  async getUserAssignment(userId) {
    const user = INITIAL_USERS.find((u) => u.id === userId);
    if (!user) throw new Error('Không tìm thấy người dùng');
    return Promise.resolve({ ...user });
  },

  // Cập nhật phân quyền người dùng
  async updateUserAssignment(userId, data) {
    return Promise.resolve({
      success: true,
      userId,
      data,
      updatedAt: new Date().toISOString(),
    });
  },

  // Lấy danh mục kho hàng
  async getWarehouses() {
    return Promise.resolve([...WAREHOUSES_LIST]);
  },

  // Lấy danh mục địa bàn
  async getTerritories() {
    return Promise.resolve([...TERRITORIES_LIST]);
  },
};
