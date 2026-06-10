import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5056/api').replace(/\/$/, '');

export interface NotificationDto {
  notiId: number;
  title: string;
  content: string;
  notiType?: string;
  createdByUserId: number;
  targetRole?: string;
  targetUserId?: number;
  isRead?: boolean;
  createdAt?: string;
}

class NotificationService {
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
   * Lấy danh sách thông báo của user hiện tại
   */
  async getNotifications(userId: number, roleName?: string): Promise<NotificationDto[]> {
    try {
      const params: any = { userId };
      if (roleName) {
        params.roleName = roleName;
      }
      const response = await this.api.get<NotificationDto[]>('/notifications', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể lấy danh sách thông báo');
    }
  }

  /**
   * Đánh dấu thông báo đã đọc
   */
  async markAsRead(notiId: number): Promise<void> {
    try {
      await this.api.put(`/notifications/${notiId}/read`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể đánh dấu thông báo đã đọc');
    }
  }

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  async markAllAsRead(userId: number, roleName?: string): Promise<void> {
    try {
      const params: any = { userId };
      if (roleName) {
        params.roleName = roleName;
      }
      await this.api.put('/notifications/read-all', null, { params });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể đánh dấu tất cả thông báo là đã đọc');
    }
  }

  /**
   * Xóa thông báo
   */
  async deleteNotification(notiId: number): Promise<void> {
    try {
      await this.api.delete(`/notifications/${notiId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể xóa thông báo');
    }
  }
}

export default new NotificationService();
