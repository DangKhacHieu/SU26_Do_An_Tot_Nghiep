import { UserDto } from './user.types';

/**
 * Request body cho login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Response sau login
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
  redirectUrl: string;
}

/**
 * Request để refresh token
 */
export interface RefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}

/**
 * User state trong app
 */
export interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  cccd: string;
}

export interface RegisterResponse {
  requiresVerification: boolean;
  email: string;
  message: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}