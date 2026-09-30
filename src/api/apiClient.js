/**
 * apiClient.js - Bộ xử lý API tập trung với Interceptor điều hướng trang lỗi
 * Tự động bắt mã lỗi 401, 403, 404, 500 và chuyển người dùng sang trang lỗi tương ứng
 */

class ApiClient {
  constructor() {
    this.errorHandler = null; // Callback hàm chuyển trang lỗi (ví dụ: (code) => handleNavigateError(code))
  }

  /**
   * Đăng ký callback xử lý lỗi điều hướng toàn hệ thống
   */
  setErrorHandler(handler) {
    this.errorHandler = handler;
  }

  /**
   * Hàm gọi API chung với Interceptor xử lý lỗi tự động
   */
  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          ...options.headers,
        },
        ...options,
      });

      // Nếu HTTP status >= 400 -> Bắt lỗi và điều hướng
      if (!response.ok) {
        this.handleHttpError(response.status, response.statusText);
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw { status: response.status, data: errorData };
      }

      return await response.json();
    } catch (error) {
      // Lỗi kết nối mạng hoặc lỗi server sập
      if (error instanceof TypeError || !error.status) {
        this.handleHttpError(500, 'Lỗi kết nối máy chủ hoặc mất mạng');
      }
      throw error;
    }
  }

  /**
   * Xử lý chuyển hướng đến đúng trang lỗi dựa vào HTTP status code
   */
  handleHttpError(statusCode, message = '') {
    console.warn(`[ApiClient Interceptor] Phát hiện lỗi API ${statusCode}: ${message}`);
    
    if (typeof this.errorHandler === 'function') {
      switch (statusCode) {
        case 401:
          // Phiên làm việc hết hạn hoặc token không hợp lệ
          this.errorHandler(401, 'Phiên đăng nhập hết hạn hoặc không hợp lệ.');
          break;
        case 403:
          // Không đủ quyền truy cập API này
          this.errorHandler(403, 'Tài khoản không đủ quyền thực hiện thao tác API này.');
          break;
        case 404:
          // Không tìm thấy tài nguyên API
          this.errorHandler(404, 'Tài nguyên API không tìm thấy.');
          break;
        case 500:
        default:
          // Lỗi sập máy chủ phía Backend
          this.errorHandler(500, 'Máy chủ gặp sự cố hoặc gián đoạn kết nối.');
          break;
      }
    }
  }

  /**
   * Hàm giả lập gọi API để test chuyển trang lỗi trong giao diện Demo
   */
  simulateApiCall(targetStatus) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        this.handleHttpError(targetStatus, `Giả lập phản hồi API mã lỗi ${targetStatus}`);
        reject({ status: targetStatus, message: `Lỗi giả lập ${targetStatus}` });
      }, 400);
    });
  }

  get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  post(url, body, options = {}) {
    return this.request(url, { ...options, method: 'POST', body: JSON.stringify(body) });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
