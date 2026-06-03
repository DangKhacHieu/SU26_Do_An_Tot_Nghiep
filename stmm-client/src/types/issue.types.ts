export interface IssueDto {
  issueId: number;
  stallId: number;
  stallCode: string;
  title: string;
  description: string;
  imageUrl: string | null;
  status: string;
  createdByUserId: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string | null;
  assignedTaskId: number | null;
  assignedTaskStatus: string | null;
}

export interface IssueQueryParams {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
  sortDescending?: boolean;
}

export interface CreateIssueRequest {
  stallId: number;
  title: string;
  description: string;
  imageUrl?: string;
}

export interface UpdateIssueStatusRequest {
  newStatus: 'InProgress' | 'Resolved';
}
