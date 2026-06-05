import axios, { AxiosInstance } from 'axios';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RegisterRequest
} from '../types/auth.types';

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5056/api').replace(/\/$/, '');

const getApiErrorMessage = (error: any, fallback: string): string => {
  const data = error.response?.data;

  if (data?.message) return data.message;
  if (data?.detail) return data.detail;

  if (data?.errors && typeof data.errors === 'object') {
    return Object.values(data.errors).flat().join(', ');
  }

  if (error.code === 'ERR_NETWORK') {
    return 'Không kết nối được API. Hãy kiểm tra API đã chạy đúng cổng trong file .env chưa.';
  }

  return fallback;
};

class AuthService {
  private api: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load tokens from localStorage
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');

    // Add interceptor để tự động thêm token vào header
    this.api.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Add interceptor để handle token expiry
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Nếu lỗi 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Gọi refresh endpoint
            if (this.accessToken && this.refreshToken) {
              const response = await this.refreshAccessToken(
                this.accessToken,
                this.refreshToken
              );
              
              // Cập nhật token
              this.accessToken = response.accessToken;
              this.refreshToken = response.refreshToken;
              this.saveTokens(response);

              // Retry original request
              originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Nếu refresh thất bại, logout
            this.logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Đăng nhập
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      this.accessToken = response.data.accessToken;
      this.refreshToken = response.data.refreshToken;
      this.saveTokens(response.data);

      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Đăng nhập thất bại'));
    }
  }

  /**
   * Làm mới Access Token
   */
  private async refreshAccessToken(
    accessToken: string,
    refreshToken: string
  ): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/auth/refresh`,
        {
          accessToken,
          refreshToken,
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error('Refresh token thất bại');
    }
  }

  /**
   * Đăng xuất
   */
  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * Lưu tokens vào localStorage
   */
  private saveTokens(data: LoginResponse): void {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  /**
   * Lấy user hiện tại
   */
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Kiểm tra người dùng đã đăng nhập hay chưa
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Lấy access token
   */
  getAccessToken(): string | null {
    return this.accessToken || localStorage.getItem('accessToken');
  }

  /**
   * Đăng ký
   */
  async register(request: RegisterRequest): Promise<LoginResponse> {
    try {
      const response = await this.api.post<LoginResponse>('/auth/register', request);

      this.accessToken = response.data.accessToken;
      this.refreshToken = response.data.refreshToken;
      this.saveTokens(response.data);

      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Đăng ký thất bại'));
    }
  }

  /**
   * Đổi mật khẩu
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      await this.api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, "Đổi mật khẩu thất bại"));
    }
  }
}

export default new AuthService();