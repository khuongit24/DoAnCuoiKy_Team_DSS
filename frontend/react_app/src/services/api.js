import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    let errorMessage = 'Đã xảy ra lỗi không xác định.';

    // Removed 401 redirect logic completely because auth is bypassed.

    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        errorMessage = 'Không có quyền truy cập (401).';
      } else if (status === 403) {
        errorMessage = 'Bạn không có quyền thực hiện thao tác này (403).';
      } else if (status === 404) {
        errorMessage = 'Không tìm thấy tài nguyên yêu cầu (404).';
      } else if (status >= 400 && status < 500) {
        errorMessage = error.response.data?.error?.message || error.response.data?.message || `Lỗi dữ liệu đầu vào (${status}).`;
      } else if (status >= 500) {
        errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau (5xx).';
      }
    } else if (error.request) {
      errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.';
    } else {
      errorMessage = error.message;
    }

    if (!originalRequest.url.includes('/auth/login')) {
      if (error.response?.status !== 401 || originalRequest._retry) {
        window.dispatchEvent(new CustomEvent('api-error', { detail: errorMessage }));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
