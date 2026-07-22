import axios, { AxiosInstance } from 'axios';
import {
  MeterDto,
  MeterQueryParameters,
  CreateMeterRequest,
  UpdateMeterRequest
} from '../types/meter.types';
import { PagedResult } from '../types/common.types';

const _rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5056/api').replace(/\/$/, '');
const API_BASE_URL = _rawUrl.endsWith('/api') ? _rawUrl : `${_rawUrl}/api`;

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

class MeterService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Lấy danh sách công tơ phân trang và lọc (dành cho Manager)
   */
  async getMeters(params: MeterQueryParameters): Promise<PagedResult<MeterDto>> {
    try {
      const response = await this.api.get<PagedResult<MeterDto>>('/meters', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Lấy danh sách công tơ thất bại'));
    }
  }

  /**
   * Lấy thông tin chi tiết một công tơ
   */
  async getMeterById(id: number): Promise<MeterDto> {
    try {
      const response = await this.api.get<MeterDto>(`/meters/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, `Lấy chi tiết công tơ #${id} thất bại`));
    }
  }

  /**
   * Tạo công tơ mới trong kho (dành cho Manager)
   */
  async createMeter(request: CreateMeterRequest): Promise<MeterDto> {
    try {
      const response = await this.api.post<MeterDto>('/meters', request);
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Thêm công tơ mới thất bại'));
    }
  }

  /**
   * Cập nhật thông tin công tơ (dành cho Manager)
   */
  async updateMeter(id: number, request: UpdateMeterRequest): Promise<MeterDto> {
    try {
      const response = await this.api.put<MeterDto>(`/meters/${id}`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, `Cập nhật công tơ #${id} thất bại`));
    }
  }

  /**
   * Lấy danh sách công tơ chưa gán cho sạp (để gán sạp hoặc thay thế)
   */
  async getUnassignedMeters(type?: string): Promise<MeterDto[]> {
    try {
      const response = await this.api.get<MeterDto[]>('/meters/unassigned', {
        params: { type }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'Lấy danh sách công tơ chưa gán thất bại'));
    }
  }
}

export default new MeterService();
