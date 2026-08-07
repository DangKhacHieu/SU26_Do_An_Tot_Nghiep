export interface TaskSummaryDto {
  taskId: number;
  assignedToUserId: number;
  assignedToName: string;
  requestId: number | null;
  issueId: number | null;
  areaId?: number | null;
  areaName?: string | null;
  stallId?: number | null;
  stallCode?: string | null;
  taskType: 'Repair' | 'UtilityReading';
  title: string;
  status: 'Pending' | 'PendingApproval' | 'In_Progress' | 'Completed' | 'Cancelled';
  actualCost: number | null;
  createdAt: string;
  completedAt: string | null;
  relatedStallIds?: number[];
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
  requestPaidBy?: string | null;
}

export interface CreateTaskRequest {
  assignedToUserId: number;
  requestId?: number;
  issueId?: number;
  areaId?: number;
  taskType: 'Repair' | 'UtilityReading';
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

export interface UtilityStallChecklistDto {
  stallId: number;
  stallCode: string;
  stallStatus: string;
  hasElectricityMeter: boolean;
  hasWaterMeter: boolean;
  hasElectricityReadingThisMonth: boolean;
  hasWaterReadingThisMonth: boolean;
  hasReadingThisMonth: boolean;
}

export interface AssignTaskRequest {
  staffUserId: number;
}

