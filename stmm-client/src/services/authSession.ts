import axios, { AxiosInstance } from 'axios';
import { LoginResponse } from '../types/auth.types';

const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5056/api').replace(/\/$/, '');
const apiBaseUrl = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

let refreshPromise: Promise<string> | null = null;

const clearSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth-session-expired'));
};

/**
 * Refreshes the current access token once, even when several requests receive
 * a 401 response at the same time.
 */
export const refreshAccessToken = async (): Promise<string> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  if (!accessToken || !refreshToken) {
    clearSession();
    throw new Error('The login session has expired.');
  }

  refreshPromise = axios
    .post<LoginResponse>(
      `${apiBaseUrl}/auth/refresh`,
      { accessToken, refreshToken },
      { skipAuthRefresh: true } as never)
    .then(({ data }) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.accessToken;
    })
    .catch((error) => {
      clearSession();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

/** Adds one retry with a refreshed token to an Axios client. */
export const installAuthRefreshInterceptor = (api: AxiosInstance): void => {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const request = error.config as (typeof error.config & {
        _retry?: boolean;
        skipAuthRefresh?: boolean;
      }) | undefined;

      if (
        error.response?.status !== 401 ||
        !request ||
        request._retry ||
        request.skipAuthRefresh ||
        request.url?.includes('/auth/refresh'))
      {
        return Promise.reject(error);
      }

      request._retry = true;
      const token = await refreshAccessToken();
      request.headers = request.headers ?? {};
      request.headers.Authorization = `Bearer ${token}`;
      return api(request);
    });
};
