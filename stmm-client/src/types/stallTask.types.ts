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

export interface StaffStallLookupDto {
  stallId: number;
  stallCode: string;
  areaName: string;
  vendorName?: string | null;
}

