export const MANAGER_QUOTATION_ACTION = Object.freeze({
  APPROVE_AS_MARKET: 'ApproveAsMarket',
  SEND_TO_VENDOR: 'SendToVendor',
  RETURN_FOR_REVISION: 'ReturnForRevision'
});

export const OTHER_CONTRACT_CLAUSE = 'Khác / Không áp dụng điều khoản cụ thể';

export const REPAIR_RESPONSIBILITY_CLAUSES = Object.freeze([
  'Hư hỏng do hao mòn tự nhiên hoặc tài sản chung của chợ',
  'Hư hỏng phát sinh trong quá trình sử dụng của tiểu thương',
  'Sửa chữa hoặc cải tạo theo yêu cầu riêng của tiểu thương',
  OTHER_CONTRACT_CLAUSE
]);

export const MANAGER_QUOTATION_ACTION_OPTIONS = Object.freeze([
  {
    value: MANAGER_QUOTATION_ACTION.APPROVE_AS_MARKET,
    label: 'Chợ chịu phí và duyệt thi công'
  },
  {
    value: MANAGER_QUOTATION_ACTION.SEND_TO_VENDOR,
    label: 'Tiểu thương chịu phí, gửi xác nhận'
  },
  {
    value: MANAGER_QUOTATION_ACTION.RETURN_FOR_REVISION,
    label: 'Trả Staff chỉnh sửa báo giá'
  }
]);

export const actionRequiresContractClause = (action) => (
  action === MANAGER_QUOTATION_ACTION.APPROVE_AS_MARKET
  || action === MANAGER_QUOTATION_ACTION.SEND_TO_VENDOR
);

export const actionRequiresDecisionNote = (action, contractClause) => (
  action === MANAGER_QUOTATION_ACTION.RETURN_FOR_REVISION
  || (actionRequiresContractClause(action) && contractClause === OTHER_CONTRACT_CLAUSE)
);
