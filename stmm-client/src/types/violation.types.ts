export interface ViolationDto {
  violationId: number;
  stallId: number;
  stallCode: string;
  createdBy: number;
  title: string;
  description: string;
  imageUrl: string;
  fineAmount: number;
  status: string;
  notifiedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateViolationRequest {
  stallId: number;
  violationTypeId: number;
  title: string;
  description: string;
  imageUrl: string;
  fineAmount: number;
}

export interface ViolationQueryParams {
  pageNumber?: number;
  pageSize?: number;
  status?: string | null;
  sortDescending?: boolean;
}

export interface ViolationTypeDto {
  violationTypeId: number;
  name: string;
  description: string | null;
  defaultFine: number | null;
  isActive: boolean | null;
}
