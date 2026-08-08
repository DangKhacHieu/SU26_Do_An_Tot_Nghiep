const fs = require('fs');

const viNew = require('./vi_new_errors.json');

const enTranslations = {
  ERR_VENDOR_PROFILE_NOT_FOUND_FOR_THIS_USER: 'Vendor profile not found for this user.',
  ERR_SO_TRANG_KHONG_HOP_LE: 'Invalid page number.',
  ERR_KICH_THUOC_TRANG_PHAI_TU_1_DEN_100: 'Page size must be between 1 and 100.',
  ERR_LOAI_YEU_CAU_KHONG_HOP_LE: 'Invalid request type.',
  ERR_TRANG_THAI_YEU_CAU_KHONG_HOP_LE: 'Invalid request status.',
  ERR_ID_YEU_CAU_KHONG_HOP_LE: 'Invalid request ID.',
  ERR_KHONG_TIM_THAY_YEU_CAU_HOAC_BAN_KHONG_CO_QUYEN_XEM: 'Request not found or you do not have permission to view it.',
  ERR_VUI_LONG_CHON_SAP_STALLID_HOP_LE: 'Please select a valid stall (StallId).',
  ERR_TIEU_DE_KHONG_DUOC_DE_TRONG: 'Title cannot be empty.',
  ERR_MO_TA_KHONG_DUOC_DE_TRONG: 'Description cannot be empty.',
  ERR_VUI_LONG_CUNG_CAP_ID_BIEN_BAN_VI_PHAM_CAN_KHANG_NG: 'Please provide the violation report ID to appeal.',
  ERR_LOAI_YEU_CAU_NAY_KHONG_DUOC_PHEP_DINH_KEM_BIEN_BAN: 'This request type is not allowed to attach a violation report.',
  ERR_VUI_LONG_CUNG_CAP_ID_HOA_DON_CAN_KHIEU_NAI: 'Please provide the invoice ID to dispute.',
  ERR_KHONG_TIM_THAY_HOA_DON_CAN_KHIEU_NAI_HOAC_HOA_DON: 'Invoice to dispute not found or it does not belong to your stall.',
  ERR_HOA_DON_NAY_DA_DUOC_DIEU_CHINH_KHONG_THE_KHIEU_NAI: 'This invoice has been adjusted and cannot be disputed again.',
  ERR_HOA_DON_NAY_DANG_DUOC_KHIEU_NAI_KHONG_THE_KHIEU_NA: 'This invoice is already being disputed.',
  ERR_LOAI_YEU_CAU_NAY_KHONG_DUOC_PHEP_DINH_KEM_HOA_DON: 'This request type is not allowed to attach an invoice.',
  ERR_BAN_KHONG_CO_QUYEN_TAO_YEU_CAU_CHO_SAP_NAY_VI_KHON: 'You do not have permission to create a request for this stall due to an invalid contract.',
  ERR_KHONG_TIM_THAY_BIEN_BAN_VI_PHAM_HOAC_BAN_KHONG_CO: 'Violation report not found or you do not have permission to appeal it.',
  ERR_BIEN_BAN_NAY_DANG_TRONG_QUA_TRINH_XU_LY_KHANG_NGHI: 'This violation is currently under appeal processing or finalized and cannot be appealed again.',
  ERR_KHONG_TIM_THAY_YEU_CAU_HOAC_BAN_KHONG_CO_QUYEN_HUY: 'Request not found or you do not have permission to cancel it.',
  ERR_CHI_CO_THE_HUY_NHUNG_YEU_CAU_DANG_O_TRANG_THAI_CHO: 'Only requests in Pending status can be cancelled.',
  ERR_KHONG_TIM_THAY_YEU_CAU_SUA_CHUA_ID_REQUESTID: 'Facility repair request ID {{arg0}} not found.',
  ERR_CHI_CO_THE_PHE_DUYET_BAO_GIA_CHO_CAC_YEU_CAU_SUA_C: 'Only quotes for facility repair requests can be approved.',
  ERR_YEU_CAU_NAY_KHONG_O_TRANG_THAI_CHO_DUYET_BAO_GIA: 'This request is not in the awaiting quote approval status.',
  ERR_YEU_CAU_NAY_KHONG_DO_TIEU_THUONG_CHI_TRA_NEN_KHONG: 'This request is not paid by the vendor so it cannot be approved.',
  ERR_BAO_GIA_NAY_DA_DUOC_XU_LY_TRUOC_DO: 'This quote has already been processed.',
  ERR_KHONG_XAC_DINH_DUOC_DANH_TINH_NGUOI_BAN: 'Cannot identify vendor identity.',
  ERR_ID_DANG_KY_DICH_VU_KHONG_HOP_LE: 'Invalid service registration ID.',
  ERR_KHONG_TIM_THAY_THONG_TIN_DANG_KY_DICH_VU: 'Service registration info not found.',
  ERR_BAN_KHONG_CO_QUYEN_TRUY_CAP_THONG_TIN_DICH_VU_NAY: 'You do not have access to this service information.',
  ERR_KHONG_TIM_THAY_THONG_TIN_DICH_VU: 'Service information not found.',
  ERR_THONG_TIN_ID_SAP_HOAC_ID_DICH_VU_KHONG_HOP_LE: 'Stall ID or Service ID information is invalid.',
  ERR_BAN_CO_HOA_DON_QUA_HAN_CHUA_THANH_TOAN_VUI_LONG_HO: 'You have overdue unpaid invoices. Please settle your debt before registering a new service.',
  ERR_BAN_KHONG_CO_QUYEN_DANG_KY_DICH_VU_CHO_SAP_NAY: 'You do not have permission to register a service for this stall.',
  ERR_DICH_VU_NAY_HIEN_KHONG_CON_KHA_DUNG_VUI_LONG_CHON: 'This service is currently unavailable. Please choose another service.',
  ERR_DICH_VU_NAY_KHONG_DUOC_CUNG_CAP_TAI_CHO_CUA_SAP_BA: 'This service is not provided at the market of your stall.',
  ERR_BAN_DANG_CO_DICH_VU_NAY_DANG_HOAT_DONG_VA_CHUA_HOA: 'You already have this service active and incomplete. Cannot register again.',
  ERR_BAN_DA_DANG_KY_DICH_VU_NAY_ROI_VUI_LONG_KIEM_TRA_L: 'You have already registered for this service. Please check in My Services.',
  ERR_PENDING_CANCELLATION_ERROR_ENDDATESTR: 'PENDING_CANCELLATION_ERROR|{{arg0}}',
  ERR_DICH_VU_NAY_DA_DUOC_HUY: 'This service has been cancelled.',
  ERR_DAY_LA_DICH_VU_VAN_HANH_BAT_BUOC_CUA_CHO_KHONG_THE: 'This is a mandatory market operation service and cannot be cancelled manually. Please contact Management.',
  ERR_DICH_VU_NAY_DA_DUOC_YEU_CAU_HUY_GIA_HAN_TU_TRUOC: 'This service has already been requested to cancel renewal.',
  ERR_DICH_VU_NAY_DANG_DUOC_TU_DONG_GIA_HAN: 'This service is currently auto-renewing.',
  ERR_CHI_CO_THE_KICH_HOAT_LAI_CAC_DICH_VU_DANG_CHO_HUY: 'Only services waiting to cancel renewal can be reactivated. For completely cancelled services, please re-register.',
  ERR_VIOLATION_WITH_ID_ID_NOT_FOUND: 'Violation with ID {{arg0}} not found.',
  ERR_STALL_WITH_ID_REQUEST_STALLID_NOT_FOUND: 'Stall with ID {{arg0}} not found.',
  ERR_VIOLATION_TYPE_WITH_ID_REQUEST_VIOLATIONTYPEID_WAS: 'Violation type with ID {{arg0}} was not found or is inactive.',
  ERR_THE_ACCOUNTTYPE_ACCOUNT_IS_NOT_ASSIGNED_TO_A_MARKE: 'The {{arg0}} account is not assigned to a market.',
  ERR_BAN_KHONG_CO_QUYEN_THAO_TAC_TREN_CHO_NAY: 'You do not have permission to perform actions on this market.',
  ERR_KHONG_TIM_THAY_BIEN_BAN_VI_PHAM_ID_VIOLATIONID: 'Violation report ID {{arg0}} not found.',
  ERR_CHI_CO_THE_CHOT_CAC_VI_PHAM_O_TRANG_THAI_PENDING_H: 'Can only finalize violations in Pending or Notified status without an appeal.',
  ERR_KE_TOAN_CHUA_DUOC_PHAN_CONG_QUAN_LY_CHO: 'Accountant has not been assigned to manage a market.',
  ERR_CHI_CO_THE_XUAT_HOA_DON_CHO_CAC_VI_PHAM_DA_CO_QUYE: 'Can only issue invoices for violations that have a final decision (FinalApproved).',
  ERR_BIEN_BAN_NAY_CHUA_CO_SO_TIEN_PHAT_HOP_LE_DE_TAO_HO: 'This violation does not have a valid fine amount to create an invoice.',
  ERR_SAP_VIOLATION_STALL_CODE_HIEN_KHONG_CO_HOP_DONG_TH: 'Stall {{arg0}} currently has no active lease contract to record the invoice.',
  ERR_KHONG_TIM_THAY_LOAI_PHI_CAU_HINH_CHO_TIEN_PHAT_TRO: "Could not find configured Fee Type for 'Fines' in the system. Please create this Fee Type first.",
  ERR_TEN_LOAI_VI_PHAM_REQUEST_NAME_DA_TON_TAI: "Violation type name '{{arg0}}' already exists.",
  ERR_KHONG_TIM_THAY_LOAI_VI_PHAM_ID_ID: 'Violation type ID {{arg0}} not found.',
  ERR_TEN_LOAI_VI_PHAM_REQUEST_NAME_DA_TON_TAI_O_LOAI_VI: "Violation type name '{{arg0}}' already exists in another type.",
  ERR_KHONG_THE_XOA_LOAI_VI_PHAM_VT_NAME_VI_DANG_CO_BIEN: "Cannot delete violation type '{{arg0}}' because it is being used by violation reports."
};

const viPath = '../stmm-client/src/locales/vi.json';
const enPath = '../stmm-client/src/locales/en.json';

const viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

viData.errors = { ...viData.errors, ...viNew };
enData.errors = { ...enData.errors, ...enTranslations };

fs.writeFileSync(viPath, JSON.stringify(viData, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));

console.log('Merged successfully.');
