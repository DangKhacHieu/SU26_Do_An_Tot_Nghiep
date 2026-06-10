export interface TaskSummaryDto {
  taskId: number;
  assignedToUserId: number;
  assignedToName: string;
  requestId: number | null;
  issueId: number | null;
  areaId?: number | null;
  areaName?: string | null;
  taskType: 'Repair' | 'Maintenance' | 'UtilityReading' | 'CashCollection';
  title: string;
  status: 'Pending' | 'PendingApproval' | 'In_Progress' | 'Completed' | 'Cancelled';
  actualCost: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface TaskMaterialDto {
  id: number;
  repairPriceId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface TaskDto extends TaskSummaryDto {
  description: string | null;
  imageBeforeUrl: string | null;
  imageAfterUrl: string | null;
  materials: TaskMaterialDto[];
}

export interface CreateTaskRequest {
  assignedToUserId: number;
  requestId?: number;
  issueId?: number;
  areaId?: number;
  taskType: 'Repair' | 'Maintenance' | 'UtilityReading' | 'CashCollection';
  title: string;
  description?: string;
}

export interface UpdateTaskStatusRequest {
  newStatus: 'In_Progress' | 'Cancelled';
}

export interface CompleteTaskRequest {
  imageBeforeUrl?: string;
  imageAfterUrl: string;
  completionNotes?: string;
}

export interface TaskQueryParams {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
  taskType?: string;
  assignedToUserId?: number;
  search?: string;
}

export interface UtilityStallChecklistDto {
  stallId: number;
  stallCode: string;
  stallStatus: string;
  hasReadingThisMonth: boolean;
}
