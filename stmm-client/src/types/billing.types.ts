export interface InvoiceDto {
  invoiceId: number;
  contractId: number;
  month: number;
  year: number;
  totalAmount: number;
  status: string;
  dueDate: string | null;
  createdAt: string | null;
  stallId: number;
  stallCode: string;
  stallCategory: string | null;
  vendorName: string;
  vendorPhone: string;
  details: InvoiceDetailDto[];
  payments: PaymentSummaryDto[];
}

export interface InvoiceDetailDto {
  invoiceDetailId: number;
  feeTypeId: number;
  feeTypeName: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ReceiveCashPaymentRequest {
  invoiceId: number;
}

export interface PaymentResultDto {
  paymentId: number;
  invoiceId: number;
  amount: number;
  method: string;
  transactionCode: string | null;
  paidAt: string;
  newInvoiceStatus: string;
}

export interface PaymentSummaryDto {
  paymentId: number;
  amount: number;
  method: string;
  paidAt: string;
}
