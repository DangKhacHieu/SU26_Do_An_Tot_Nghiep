export interface RequestDto {
  requestId: number;
  vendorId: number;
  vendorName: string;
  businessName: string;
  stallId: number;
  stallCode: string;
  requestType: string;
  violationId: number | null;
  invoiceId: number | null;
  title: string;
  description: string;
  imageUrl: string | null;
  status: string | null;
  quotationText: string | null;
  quotationAmount: number | null;
  isQuoteApproved: boolean | null;
  paidBy: string | null;
  vendorRejectReason: string | null;
  payerDecisionNote: string | null;
  payerContractClause: string | null;
  repairRating: number | null;
  repairComment: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ManagerQuotationDecisionRequest {
  action: 'ApproveAsMarket' | 'SendToVendor' | 'ReturnForRevision' | 'Reject' | '';
  decisionNote?: string;
  contractClause?: string;
}
