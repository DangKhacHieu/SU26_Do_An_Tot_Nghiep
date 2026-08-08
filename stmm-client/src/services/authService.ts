import axios, { AxiosInstance } from 'axios';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RegisterRequest,
  RegisterResponse
} from '../types/auth.types';

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const _rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5056/api').replace(/\/$/, '');
const API_BASE_URL = _rawUrl.endsWith('/api') ? _rawUrl : `${_rawUrl}/api`;

const translateVietnameseErrorToEnglish = (msg: string): string => {
  if (!msg) return msg;
  const lower = msg.toLowerCase();
  if (
    lower.includes("email hoặc mật khẩu không chính xác") ||
    lower.includes("incorrect email or password") ||
    lower.includes("email/mật khẩu không chính xác")
  ) {
    return "Email hoặc mật khẩu không chính xác.";
  }
  if (lower.includes("mật khẩu không chính xác") || lower.includes("incorrect password")) return "Incorrect password.";
  if (lower.includes("tài khoản không tồn tại")) return "Account does not exist.";
  if (lower.includes("tài khoản đã bị khóa")) return "Account has been locked.";
  if (lower.includes("chưa được xác nhận email")) return "Email has not been verified.";
  if (lower.includes("email đã được sử dụng")) return "Email is already in use.";
  if (lower.includes("số điện thoại đã được sử dụng")) return "Phone number is already in use.";
  if (lower.includes("không kết nối được api") || lower.includes("err_network")) return "Failed to connect to the API. Please ensure the API server is running.";
  if (lower.includes("transient failure") || lower.includes("npgsql") || lower.includes("postgresql") || lower.includes("database connection failed")) {
    return "Database connection failed. Please ensure the database server is running.";
  }
  if (lower.includes("đăng nhập thất bại")) return "Login failed.";
  if (lower.includes("đăng ký thất bại")) return "Registration failed.";
  if (lower.includes("đổi mật khẩu thất bại")) return "Failed to change password.";
  if (lower.includes("khôi phục mật khẩu thất bại")) return "Failed to request password reset.";
  if (lower.includes("xác thực otp thất bại")) return "Invalid OTP code.";
  if (lower.includes("gửi lại mã xác thực thất bại")) return "Failed to resend verification code.";
  return msg;
};

const getApiErrorMessage = (error: any, fallback: string): string => {
  const data = error.response?.data;
  let rawMessage = fallback;

  if (data?.message) {
    rawMessage = data.message;
  } else if (data?.detail) {
    rawMessage = data.detail;
  } else if (data?.errors && typeof data.errors === 'object') {
    rawMessage = Object.values(data.errors).flat().join(', ');
  } else if (error.code === 'ERR_NETWORK') {
    rawMessage = 'Không kết nối được API. Hãy kiểm tra API đã chạy đúng cổng trong file .env chưa.';
  }

  return rawMessage;
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
   * Lấy Axios instance để các API khác sử dụng chung cấu hình
   */
  public getApi(): AxiosInstance {
    return this.api;
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
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await this.api.post<RegisterResponse>('/auth/register', request);
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Đăng ký thất bại'));
    }
  }

  /**
   * Xác thực email kích hoạt tài khoản
   */
  async verifyEmail(email: string, code: string): Promise<LoginResponse> {
    try {
      const response = await this.api.post<LoginResponse>('/auth/verify-email', { email, code });

      this.accessToken = response.data.accessToken;
      this.refreshToken = response.data.refreshToken;
      this.saveTokens(response.data);

      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Xác thực email thất bại'));
    }
  }

  /**
   * Gửi lại mã OTP xác thực email
   */
  async resendVerificationCode(email: string): Promise<void> {
    try {
      await this.api.post('/auth/resend-verification', { email });
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Gửi lại mã xác thực thất bại'));
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

  /**
   * Đăng nhập hoặc đăng ký bằng tài khoản Google
   */
  async loginWithGoogle(idToken: string): Promise<LoginResponse> {
    try {
      const response = await this.api.post<LoginResponse>('/auth/google', { idToken });
      
      this.accessToken = response.data.accessToken;
      this.refreshToken = response.data.refreshToken;
      this.saveTokens(response.data);
      
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Đăng nhập Google thất bại'));
    }
  }

  /**
   * Yêu cầu khôi phục mật khẩu (gửi mã OTP)
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await this.api.post('/auth/forgot-password', { email });
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Yêu cầu khôi phục mật khẩu thất bại'));
    }
  }

  /**
   * Xác thực mã OTP khôi phục mật khẩu
   */
  async verifyResetOtp(email: string, code: string): Promise<void> {
    try {
      await this.api.post('/auth/verify-reset-otp', { email, code });
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Xác thực OTP thất bại'));
    }
  }

  /**
   * Đặt lại mật khẩu mới bằng mã OTP
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    try {
      await this.api.post('/auth/reset-password', { email, code, newPassword });
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Khôi phục mật khẩu thất bại'));
    }
  }
}

export default new AuthService();