/**
 * User information DTO
 */
export interface UserDto {
  userId: number;
  name: string;
  email: string;
  phone: string;
  roleId: number;
  roleName: string;
  status?: string;
}

/**
 * Request for updating profile
 */
export interface EditProfileRequest {
  name: string;
  phone: string;
}
