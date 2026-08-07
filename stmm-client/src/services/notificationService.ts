import axios, { AxiosInstance } from 'axios';
import { installAuthRefreshInterceptor } from './authSession';

const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5056/api').replace(/\/$/, '');
const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

export interface NotificationDto {
  notiId: number;
  title: string;
  content: string;
  notiType?: string;
  createdByUserId: number;
  targetUserId?: number;
  isRead?: boolean;
  createdAt?: string;
}

interface ApiProblem {
  detail?: string;
  title?: string;
}

const errorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError<ApiProblem>(error)) return fallback;
  return error.response?.data?.detail || error.response?.data?.title || fallback;
};

class NotificationService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    installAuthRefreshInterceptor(this.api);
  }

  async getNotifications(): Promise<NotificationDto[]> {
    try {
      const response = await this.api.get<NotificationDto[]>('/notifications');
      return response.data;
    } catch (error: unknown) {
      throw new Error(errorMessage(error, 'Unable to load notifications.'));
    }
  }

  async markAsRead(notiId: number): Promise<void> {
    try {
      await this.api.put(`/notifications/${notiId}/read`);
    } catch (error: unknown) {
      throw new Error(errorMessage(error, 'Unable to mark notification as read.'));
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await this.api.put('/notifications/read-all');
    } catch (error: unknown) {
      throw new Error(errorMessage(error, 'Unable to mark all notifications as read.'));
    }
  }

  async deleteNotification(notiId: number): Promise<void> {
    try {
      await this.api.delete(`/notifications/${notiId}`);
    } catch (error: unknown) {
      throw new Error(errorMessage(error, 'Unable to delete notification.'));
    }
  }
}

export default new NotificationService();
