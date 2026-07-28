import axios, { AxiosInstance } from 'axios';
import { UserDto } from '../types/user.types';

const _rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5056/api').replace(/\/$/, '');
const API_BASE_URL = _rawUrl.endsWith('/api') ? _rawUrl : `${_rawUrl}/api`;

const getApiErrorMessage = (error: any, fallback: string): string => {
  const data = error.response?.data;

  if (typeof data === 'string' && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.detail) return data.detail;
  if (data?.title) return data.title;

  if (data?.errors && typeof data.errors === 'object') {
    return Object.values(data.errors).flat().join(', ');
  }

  if (error.code === 'ERR_NETWORK') {
    return 'Không kết nối được API. Hãy kiểm tra API đã chạy đúng cổng trong file .env chưa.';
  }

  return fallback;
};

class UserService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add interceptor to automatically add token to request header from localStorage
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Cập nhật thông tin cá nhân
   */
  async updateProfile(userId: number, name: string, phone: string): Promise<UserDto> {
    try {
      let endpoint = (userId && Number(userId) > 0) ? `/users/profile?userId=${userId}` : `/users/profile/me`;
      let response;
      try {
        response = await this.api.put<UserDto>(endpoint, {
          name,
          phone,
        });
      } catch (err: any) {
        if (endpoint !== `/users/profile/me`) {
          response = await this.api.put<UserDto>(`/users/profile/me`, {
            name,
            phone,
          });
        } else {
          throw err;
        }
      }

      // Cập nhật thông tin user trong localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const currentUser = JSON.parse(userStr);
        const updatedUser = {
          ...currentUser,
          ...response.data,
          name: response.data?.name || name,
          phone: response.data?.phone || phone,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      }

      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Cập nhật thông tin cá nhân thất bại'));
    }
  }
}

export default new UserService();
