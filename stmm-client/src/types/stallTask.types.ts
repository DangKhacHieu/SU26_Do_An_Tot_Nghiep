export interface StallTaskSummaryDto {
  stallId: number;
  stallCode: string;
  stallCategory: string | null;
  stallStatus: string;
  vendorName: string;
  vendorPhone: string;
  hasUnpaidInvoice: boolean;
  unpaidInvoiceCount: number;
  unpaidTotalAmount: number;
  pendingTaskCount: number;
  taskTypes: string[];
}

export interface StallTaskQueryParams {
  pageNumber?: number;
  pageSize?: number;
  filter?: 'All' | 'HasUnpaidInvoice' | 'HasTask';
  search?: string;
}
