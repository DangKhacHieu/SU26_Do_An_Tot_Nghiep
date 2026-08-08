import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { createPortal } from "react-dom";
import "./ContractPrintPreview.css";

const getAuthHeaders = () => ({
  "Authorization": `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`
});

export default function ContractPrintPreview({ contract, onClose, onSaveSuccess, addToast }) {
  const { t, i18n } = useTranslation();
  const tVi = i18n.getFixedT('vi', 'translation');

  // Configurable Bên A details
  const [lessor, setLessor] = useState({
    name: "CÔNG TY TNHH QUẢN LÝ CHỢ TRUNG TÂM MHMS",
    address: tVi('contractprintpreview.quarter_6_linh_trung'),
    taxCode: "0312345678",
    cccd: "079090123456",
    licenseNum: "0312345678",
    licenseIssuer: tVi('contractprintpreview.department_of_planning_and'),
    licenseDate: "15/01/2020",
    phone: "028.3724.4555",
    email: "management@centralmarket.vn",
    representative: tVi('contractprintpreview.nguyen_van_truong'),
    position: tVi('contractprintpreview.executive_director'),
    bankAccount: "1029384756",
    bankName: tVi('contractprintpreview.joint_stock_commercial_bank'),
  });

  // Configurable Bên B details (business name, address, tax code, bank account, bank name)
  const [lessee, setLessee] = useState({
    businessName: contract?.vendorBusinessName || contract?.vendorName || "",
    address: contract?.vendorAddress || "",
    taxCode: contract?.vendorTaxCode || "",
    bankAccount: contract?.vendorBankAccount || "",
    bankName: contract?.vendorBankName || "",
  });

  const [saving, setSaving] = useState(false);

  const handleSaveVendorInfo = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5056/api/manager/contracts/${contract.contractId}/vendor-info`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          businessName: lessee.businessName.trim() || null,
          address: lessee.address.trim() || null,
          taxCode: lessee.taxCode.trim() || null,
          bankAccount: lessee.bankAccount.trim() || null,
          bankName: lessee.bankName.trim() || null,
        }),
      });

      if (res.ok) {
        const updatedContract = await res.json();
        if (addToast) {
          addToast(t('contractprintpreview.saved_party_bs_information'), "success");
        }
        if (onSaveSuccess) {
          onSaveSuccess(updatedContract);
        }
      } else {
        const data = await res.json();
        if (addToast) {
          addToast(data.message || t('contractprintpreview.cannot_save_party_b'), "error");
        }
      }
    } catch (err) {
      if (addToast) {
        addToast(t('contractdetailmanager.server_connection_error'), "error");
      }
    } finally {
      setSaving(false);
    }
  };

  // Calculate lease term in months/years
  const calculateDuration = () => {
    if (!contract?.startDate || !contract?.endDate) return "N/A";
    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 360) {
      const years = (diffDays / 365).toFixed(1);
      return `${years} năm`;
    }
    const months = (diffDays / 30.4).toFixed(0);
    return `${months} tháng`;
  };

  const formatCurrency = (value) => {
    if (!value) return "0";
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  // Convert number to Vietnamese words for currency
  const numberToWords = (num) => {
    if (num === 0) return tVi('contractprintpreview.no_copper');
    
    const units = ["", tVi('contractprintpreview.one'), "hai", "ba", tVi('contractprintpreview.four'), tVi('contractprintpreview.year'), tVi('contractprintpreview.six'), tVi('contractprintpreview.seven'), tVi('contractprintpreview.eight'), tVi('contractprintpreview.ripe')];
    const places = ["", tVi('contractprintpreview.thousand'), tVi('contractprintpreview.million'), tVi('contractprintpreview.billion'), tVi('contractprintpreview.trillion'), tVi('contractprintpreview.million_billion')];
    
    let words = "";
    let temp = Math.floor(num);
    let placeIndex = 0;
    
    while (temp > 0) {
      const chunk = temp % 1000;
      if (chunk > 0) {
        let chunkWords = "";
        const hundreds = Math.floor(chunk / 100);
        const tens = Math.floor((chunk % 100) / 10);
        const ones = chunk % 10;
        
        if (hundreds > 0) {
          chunkWords += units[hundreds] + tVi('contractprintpreview.hundred');
        } else if (words !== "") {
          chunkWords += tVi('contractprintpreview.zero_hundred');
        }
        
        if (tens > 1) {
          chunkWords += units[tens] + tVi('contractprintpreview.ten');
          if (ones === 1) chunkWords += tVi('contractprintpreview.fashion');
          else if (ones === 5) chunkWords += tVi('contractprintpreview.five');
          else if (ones > 0) chunkWords += units[ones];
        } else if (tens === 1) {
          chunkWords += tVi('contractprintpreview.ten');
          if (ones === 5) chunkWords += tVi('contractprintpreview.five');
          else if (ones > 0) chunkWords += units[ones];
        } else {
          if (ones > 0) {
            if (hundreds > 0 || words !== "") chunkWords += tVi('contractprintpreview.odd');
            chunkWords += units[ones];
          }
        }
        words = chunkWords + " " + places[placeIndex] + " " + words;
      }
      temp = Math.floor(temp / 1000);
      placeIndex++;
    }
    
    words = words.trim().replace(/\s+/g, " ");
    return words.charAt(0).toUpperCase() + words.slice(1) + tVi('contractprintpreview.even_coin');
  };

  const handlePrint = () => {
    window.print();
  };

  // Format today's date
  const today = new Date();
  const todayDay = String(today.getDate()).padStart(2, "0");
  const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
  const todayYear = today.getFullYear();

  return createPortal(
    <div className="print-preview-modal animate-fade-in">
      <div className="print-header-bar no-print">
        <h3 className="print-header-title">Hợp đồng thuê kiot số: {contract?.contractId ? String(contract.contractId).padStart(4, "0") : "....."}/HĐ-MHMS</h3>
        <div className="print-header-actions">
          <button className="btn-print-action" onClick={handlePrint}>
            {t('contractprintpreview.export_pdf_files')}
          </button>
          <button className="btn-close-preview" onClick={onClose}>
            {t('contractprintpreview.close')}
          </button>
        </div>
      </div>

      {(() => {
        const t = tVi;
        return (
          <div className="print-preview-container print-area">
        
        {/* PAGE 1: NATIONAL HEADER, TITLE, BASIS, LESSOR & LESSEE */}
        <div className="a4-page">
          <div className="print-header">
            <div className="header-national">
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong>
              <span>{t('contractprintpreview.independence_freedom_happiness')}</span>
              <div className="header-divider"></div>
            </div>
            <div className="header-title">
              <h2>HỢP ĐỒNG THUÊ KIOT</h2>
              <span>Số: {contract?.contractId ? String(contract.contractId).padStart(4, "0") : "....."}/HĐ-MHMS</span>
            </div>
          </div>

          <div className="print-content">
            <ul className="legal-basis">
              <li>{t('contractprintpreview.pursuant_to_civil_code')}</li>
              <li>{t('contractprintpreview.pursuant_to_the_law')}</li>
              <li>{t('contractprintpreview.pursuant_to_land_law')}</li>
              <li>{t('contractprintpreview.based_on_the_needs')}</li>
            </ul>

            <p className="intro-text">
              Hôm nay, ngày {todayDay} tháng {todayMonth} năm {todayYear}, tại văn phòng Ban quản lý Chợ Trung Tâm, chúng tôi gồm:
            </p>

            <div className="party-info">
              <h3>BÊN A: TÊN CÔNG TY/CÁ NHÂN CHO THUÊ</h3>
              <ul>
                <li>• <strong>{t('contractprintpreview.name_of_organizationcompanyindividual')}</strong> {lessor.name}</li>
                <li>• <strong>{t('contractprintpreview.head_office_address')}</strong> {lessor.address}</li>
                <li>• <strong>{t('contractprintpreview.tax_codenumber')}</strong> {lessor.taxCode}</li>
                <li>• <strong>CCCD/CMND:</strong> {lessor.cccd}</li>
                <li>• <strong>{t('contractprintpreview.business_registration_certificate_no')}</strong> {lessor.licenseNum}</li>
                <li>• <strong>Do:</strong> {lessor.licenseIssuer} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{t('contractprintpreview.date_level')}</strong> {lessor.licenseDate}</li>
                <li>• <strong>{t('contractprintpreview.phone')}</strong> {lessor.phone} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Email:</strong> {lessor.email}</li>
                <li>• <strong>{t('contractprintpreview.representative')}</strong> {lessor.representative} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{t('contractprintpreview.position')}</strong> {lessor.position}</li>
                <li>• <strong>{t('contractprintpreview.bank_account')}</strong> {lessor.bankAccount}</li>
                <li>• <strong>{t('contractprintpreview.at_the_bank')}</strong> {lessor.bankName}</li>
              </ul>
              <p className="party-abbreviation">{t('contractprintpreview.hereinafter_referred_to_as')}</p>
            </div>

            <div className="party-info" style={{ marginTop: "12pt" }}>
              <h3>BÊN B: TÊN CÔNG TY/CÁ NHÂN THUÊ</h3>
              <ul>
                <li>• <strong>{t('contractprintpreview.name_of_organizationcompanyindividual')}</strong> {lessee.businessName || "..................................................."}</li>
                <li>• <strong>{t('contractprintpreview.head_officepermanent_address')}</strong> {lessee.address || "..................................................."}</li>
                <li>• <strong>{t('contractprintpreview.tax_codenumber')}</strong> {lessee.taxCode || "..................................................."}</li>
                <li>• <strong>CCCD/CMND:</strong> {contract?.vendorCccd || "..................................................."}</li>
                <li>• <strong>{t('contractprintpreview.business_registration_certificate_no')}</strong> {lessee.taxCode ? t('contractprintpreview.business_registration_number_lesseetaxcode') : "..................................................."}</li>
                <li>• <strong>Do:</strong> {t('contractprintpreview.department_of_planning_and')}<strong>{t('contractprintpreview.date_level')}</strong> ...............................</li>
                <li>• <strong>{t('contractprintpreview.phone')}</strong> {contract?.vendorPhone || "................................"} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Email:</strong> {contract?.vendorEmail || "................................"}</li>
                <li>• <strong>{t('contractprintpreview.representative')}</strong> {contract?.vendorName || "................................"} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{t('contractprintpreview.position')}</strong> {t('contractprintpreview.legal_representative')}</li>
                <li>• <strong>{t('contractprintpreview.bank_account')}</strong> {lessee.bankAccount || "..................................................."}</li>
                <li>• <strong>{t('contractprintpreview.at_the_bank')}</strong> {lessee.bankName || "..................................................."}</li>
              </ul>
              <p className="party-abbreviation">{t('contractprintpreview.hereinafter_referred_to_as')}</p>
            </div>

            <p className="agreement-clause" style={{ marginTop: "10pt" }}>
              {t('contractprintpreview.the_two_parties_hereinafter')}</p>
          </div>
        </div>

        {/* PAGE 3: DEFINITIONS AND STALL DETAILS */}
        <div className="a4-page">
          <div className="print-content">
            <div className="section-title">1. ĐỊNH NGHĨA VÀ GIẢI THÍCH</div>
            <p className="clause-item"><strong>{t('contractprintpreview.11_in_this_contract')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>{t('contractprintpreview.a_kiosk')}</strong> {t('contractprintpreview.is_a_specific_business')}</li>
              <li><strong>{t('contractprintpreview.b_rent')}</strong> {t('contractprintpreview.is_the_amount_that')}</li>
              <li><strong>{t('contractprintpreview.c_deposit')}</strong> {t('contractprintpreview.is_the_amount_of')}</li>
              <li><strong>{t('contractprintpreview.d_major_damage')}</strong> {t('contractprintpreview.are_damages_that_seriously')}</li>
              <li><strong>{t('contractprintpreview.e_natural_wear_and')}</strong> {t('contractprintpreview.is_the_decline_in')}</li>
              <li><strong>{t('contractprintpreview.f_force_majeure_event')}</strong> {t('contractprintpreview.is_an_event_that')}</li>
              <li><strong>{t('contractprintpreview.g_device')}</strong> {t('contractprintpreview.are_items_machinery_and')}</li>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.12_explanation')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.titles_and_terms_are')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.this_agreement_is_to')}</li>
              <li><strong>c.</strong> {t('contractprintpreview.references_to_day_month')}</li>
            </ul>

            <div className="section-title">2. ĐỐI TƯỢNG VÀ MỤC ĐÍCH THUÊ</div>
            <p className="clause-item"><strong>{t('contractprintpreview.21_tenants')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.party_a_agrees_to')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.detailed_information_about_the')}</li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.exact_location_digital_kiosk')}<strong>{contract?.stallCode || "....."}</strong>{t('contractprintpreview.in_the_area')}<strong>{contract?.areaName || "....."}</strong>{t('contractprintpreview.belonging')}<strong>{contract?.marketName || "MHMS Central Market"}</strong>.</li>
                <li>{t('contractprintpreview.floor_area')}<strong>{contract?.stallSize ? `${contract.stallSize} m²` : "..... m²"}</strong>.</li>
                <li>{t('contractprintpreview.original_condition_the_kiosk')}</li>
                <li>{t('contractprintpreview.attached_equipment_air_conditioning')}</li>
              </ul>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.22_rental_purpose')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.kiosks_are_used_to')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.party_b_commits_not')}</li>
              <li><strong>c.</strong> {t('contractprintpreview.party_b_commits_not')}</li>
            </ul>
          </div>
        </div>

        {/* PAGE 4: LEASE TERM AND RENT FEES */}
        <div className="a4-page">
          <div className="print-content">
            <div className="section-title">3. THỜI HẠN THUÊ VÀ GIA HẠN HỢP ĐỒNG</div>
            <p className="clause-item"><strong>{t('contractprintpreview.31_rental_term')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.kiosk_rental_term_is')}<strong>{calculateDuration()}</strong>{t('contractprintpreview.as_of_date')}<strong>{contract?.startDate || "....."}</strong> {t('contractprintpreview.until_the_end_of')}<strong>{contract?.endDate || "....."}</strong>.</li>
              <li><strong>b.</strong> {t('contractprintpreview.in_case_the_actual')}</li>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.32_contract_extension')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.before_the_contract_expires')}<strong>{t('contractprintpreview.60_sixty')}</strong> {t('contractprintpreview.ngy_nu_bn_b')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.in_case_party_a')}</li>
              <li><strong>c.</strong> {t('contractprintpreview.if_party_b_does')}</li>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.33_terminating_the_contract')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.the_contract_may_be')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.party_a_has_the')}<strong>{t('contractprintpreview.15_mi_lm')}</strong> {t('contractprintpreview.days_from_the_date')}</li>
              <li><strong>c.</strong> {t('contractprintpreview.party_b_has_the')}<strong>{t('contractprintpreview.15_fifteen')}</strong> {t('contractprintpreview.days_from_the_date')}</li>
            </ul>

            <div className="section-title">4. GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN</div>
            <p className="clause-item"><strong>{t('contractprintpreview.41_rental_price')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.kiosk_rental_price_is')} <strong>{formatCurrency(contract?.rentFee)} {t('contractprintpreview.vnd_month')}</strong> ({t('contractprintpreview.in_words')}: <em>{numberToWords(contract?.rentFee)}</em>).</li>
              <li><strong>b.</strong> {t('contractprintpreview.this_rental_price_is')}</li>
              <li><strong>c.</strong> {t('contractprintpreview.the_rental_price_adjustment')}<strong>10%</strong> {t('contractprintpreview.compared_to_the_rental')}</li>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.42_other_costs')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.expenses_incurred_during_the')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.specific_fees_for_each')}</li>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.43_payment_method_and')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.party_b_will_pay')}<strong>{t('contractprintpreview.01_to_05')}</strong> {t('contractprintpreview.per_month')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.payment_method_bank_transfer')}</li>
              <li><strong>c.</strong> {t('contractprintpreview.transfer_information_party_b')}</li>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.44_handling_late_payment')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.if_party_b_is')}<strong>{t('contractprintpreview.05_year')}</strong> {t('contractprintpreview.days_compared_to_the')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.the_late_payment_interest')}<strong>0.1%</strong> {t('contractprintpreview.on_the_total_amount')}</li>
              <li><strong>c.</strong> {t('contractprintpreview.after_the_late_payment')}<strong>{t('contractprintpreview.30_thirty')}</strong> {t('contractprintpreview.date_party_a_has')}</li>
            </ul>
          </div>
        </div>

        {/* PAGE 5: DEPOSIT AND LESSOR RIGHTS */}
        <div className="a4-page">
          <div className="print-content">
            <div className="section-title">5. TIỀN ĐẶT CỌC</div>
            <p className="clause-item"><strong>{t('contractprintpreview.51_deposit_amount')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.party_b_deposits_party')}<strong>{formatCurrency(contract?.deposit)} VND</strong> {t('contractprintpreview.in_words')}<em>{numberToWords(contract?.deposit)}</em>).</li>
              <li><strong>b.</strong> Khoản tiền này tương đương với khoảng {contract?.rentFee ? (contract.deposit / contract.rentFee).toFixed(1) : "..."} tháng tiền thuê và được thanh toán cùng thời điểm ký kết Hợp đồng này.</li>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.52_purpose_of_using')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.this_deposit_is_used')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.in_case_party_b')}</li>
              <li><strong>c.</strong> {t('contractprintpreview.after_the_contract_ends')}</li>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.53_refund_of_deposit')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.the_deposit_will_be')}<strong>{t('contractprintpreview.07_seven')}</strong> {t('contractprintpreview.working_days_from_the')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.if_party_b_unilaterally')}</li>
            </ul>

            <div className="section-title">6. QUYỀN VÀ NGHĨA VỤ CỦA BÊN CHO THUÊ (BÊN A)</div>
            <p className="clause-item"><strong>{t('contractprintpreview.61_party_as_rights')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>{t('contractprintpreview.a_right_to_receive')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.party_a_has_the')}</li>
                <li>{t('contractprintpreview.in_case_party_b')}</li>
                <li>{t('contractprintpreview.if_party_b_does')}</li>
              </ul>
              <li><strong>{t('contractprintpreview.b_right_to_inspect')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.party_a_has_the')}<strong>{t('contractprintpreview.24_twenty_four')}</strong> {t('contractprintpreview.hours_access_to_the')}</li>
                <li>{t('contractprintpreview.party_a_has_the')}</li>
              </ul>
              <li><strong>{t('contractprintpreview.c_right_to_unilaterally')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.party_a_has_the')}<strong>{t('contractprintpreview.15_fifteen')}</strong> {t('contractprintpreview.days_from_the_date')}</li>
                <li>{t('contractprintpreview.serious_violations_include_but')}</li>
              </ul>
              <li><strong>{t('contractprintpreview.d_right_to_dispose')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.party_a_has_the')}</li>
                <li>{t('contractprintpreview.in_case_there_is')}</li>
              </ul>
            </ul>
          </div>
        </div>

        {/* PAGE 6: LESSOR OBLIGATIONS & LESSEE RIGHTS */}
        <div className="a4-page">
          <div className="print-content">
            <p className="clause-item"><strong>{t('contractprintpreview.62_party_as_obligations')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>{t('contractprintpreview.a_obligations_to_hand')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.deliver_the_kiosk_to')}</li>
                <li>{t('contractprintpreview.ensure_that_the_kiosk')}</li>
                <li>{t('contractprintpreview.responsible_for_repairing_major')}<strong>{t('contractprintpreview.07_seven')}</strong> {t('contractprintpreview.days_from_receipt_of')}</li>
              </ul>
              <li><strong>{t('contractprintpreview.b_obligation_to_provide')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.provide_adequate_and_stable')}</li>
                <li>{t('contractprintpreview.coordinate_with_the_marketarea')}</li>
              </ul>
              <li><strong>{t('contractprintpreview.c_obligation_to_support')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.coordinate_and_support_party')}</li>
                <li>{t('contractprintpreview.refund_the_deposit_and')}</li>
              </ul>
            </ul>

            <div className="section-title">7. QUYỀN VÀ NGHĨA VỤ CỦA BÊN THUÊ (BÊN B)</div>
            <p className="clause-item"><strong>{t('contractprintpreview.71_party_bs_rights')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>{t('contractprintpreview.a_use_and_business')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.receive_and_use_the')}</li>
                <li>{t('contractprintpreview.be_free_to_decorate')}</li>
                <li>{t('contractprintpreview.party_a_is_required')}</li>
              </ul>
              <li><strong>{t('contractprintpreview.b_rights_to_information')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.have_the_right_to')}</li>
                <li>{t('contractprintpreview.keep_your_business_information')}</li>
              </ul>
              <li><strong>{t('contractprintpreview.c_right_to_extend')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.priority_to_renew_the')}</li>
                <li>{t('contractprintpreview.has_the_right_to')}<strong>{t('contractprintpreview.15_fifteen')}</strong> {t('contractprintpreview.days_from_the_date')}</li>
              </ul>
            </ul>
          </div>
        </div>

        {/* PAGE 7: LESSEE OBLIGATIONS & MAINTENANCE */}
        <div className="a4-page">
          <div className="print-content">
            <p className="clause-item"><strong>{t('contractprintpreview.72_party_bs_obligations')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>{t('contractprintpreview.a_payment_and_financial')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.pay_in_full_and')}</li>
                <li>{t('contractprintpreview.be_solely_responsible_for')}</li>
              </ul>
              <li><strong>{t('contractprintpreview.b_obligations_to_use')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.use_the_kiosk_for')}</li>
                <li>{t('contractprintpreview.take_full_responsibility_for')}</li>
                <li>{t('contractprintpreview.selfrepair_minor_damages_that')}</li>
              </ul>
              <li><strong>{t('contractprintpreview.c_obligations_regarding_security')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.comply_with_all_regulations')}</li>
                <li>{t('contractprintpreview.make_sure_not_to')}</li>
                <li>{t('contractprintpreview.be_responsible_for_compensating')}</li>
              </ul>
              <li><strong>{t('contractprintpreview.d_handover_obligation')}</strong> {t('contractprintpreview.when_the_contract_terminates')}</li>
            </ul>

            <div className="section-title">8. SỬA CHỮA, CẢI TẠO VÀ BẢO TRÌ</div>
            <p className="clause-item"><strong>{t('contractprintpreview.81_repair_and_maintenance')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>{t('contractprintpreview.a_responsibilities_of_party')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.party_a_is_responsible')}</li>
                <li>{t('contractprintpreview.when_major_damage_occurs')}<strong>{t('contractprintpreview.24_twenty_four')}</strong> {t('contractprintpreview.hours_and_carry_out')}</li>
                <li>{t('contractprintpreview.if_party_a_fails')}</li>
              </ul>
              <li><strong>{t('contractprintpreview.b_party_bs_responsibilities')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.party_b_is_responsible')}</li>
                <li>{t('contractprintpreview.party_b_must_maintain')}</li>
              </ul>
              <li><strong>{t('contractprintpreview.c_assignment_of_responsibilities')}</strong> {t('contractprintpreview.any_damage_arising_due')}</li>
            </ul>
          </div>
        </div>

        {/* PAGE 8: ALTERATIONS, SUBLEASE & LIABILITIES */}
        <div className="a4-page">
          <div className="print-content">
            <p className="clause-item"><strong>{t('contractprintpreview.82_renovation_and_installation')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>{t('contractprintpreview.a_agreement_on_renovation')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.party_b_has_the')}</li>
                <li>{t('contractprintpreview.however_any_renovation_that')}</li>
                <li>{t('contractprintpreview.party_b_must_send')}</li>
              </ul>
              <li><strong>{t('contractprintpreview.b_responsibilities_of_party')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.party_b_takes_full')}</li>
                <li>{t('contractprintpreview.when_the_contract_terminates')}</li>
              </ul>
            </ul>

            <div className="section-title">9. CHUYỂN NHƯỢNG VÀ CHO THUÊ LẠI</div>
            <p className="clause-item"><strong>{t('contractprintpreview.91_contract_transfer')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>{t('contractprintpreview.a_transfer_conditions')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.this_contract_is_signed')}</li>
                <li>{t('contractprintpreview.party_b_may_not')}</li>
              </ul>
              <li><strong>{t('contractprintpreview.b_handling_violations')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.if_violated_party_a')}</li>
                <li>{t('contractprintpreview.party_b_will_lose')}</li>
                <li>{t('contractprintpreview.party_bs_arbitrary_transfer')}</li>
              </ul>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.92_subleasing')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>{t('contractprintpreview.a_sublease_conditions')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.party_b_is_not')}</li>
                <li>{t('contractprintpreview.sublease_requests_must_be')}</li>
                <li>{t('contractprintpreview.party_a_has_the')}</li>
              </ul>
              <li><strong>{t('contractprintpreview.b_responsibilities_when_subleasing')}</strong></li>
              <ul className="bullet-sub-list">
                <li>{t('contractprintpreview.if_party_a_agrees')}</li>
                <li>{t('contractprintpreview.the_terms_of_the')}</li>
              </ul>
            </ul>
          </div>
        </div>

        {/* PAGE 9: BREACH, FORCE MAJEURE, DISPUTES & CONTRACT END */}
        <div className="a4-page">
          <div className="print-content">
            <div className="section-title">10. VI PHẠM HỢP ĐỒNG VÀ TRÁCH NHIỆM BỒI THƯỜNG</div>
            <p className="clause-item"><strong>{t('contractprintpreview.101_handling_violations')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.if_a_party_violates')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.in_case_the_violation')}</li>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.102_compensation_liability')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.if_party_a_unilaterally')}<strong>02 (hai)</strong> {t('contractprintpreview.months_rent')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.if_party_b_unilaterally')}</li>
            </ul>

            <div className="section-title">11. SỰ KIỆN BẤT KHẢ KHÁNG</div>
            <p className="clause-item"><strong>{t('contractprintpreview.111_concepts_and_notices')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.a_force_majeure_event')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.the_affected_party_must')}</li>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.112_consequences_of_a')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.the_affected_party_will')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.if_the_force_majeure')}<strong>{t('contractprintpreview.90_ninety')}</strong> {t('contractprintpreview.consecutive_days_the_parties')}</li>
            </ul>

            <div className="section-title">12. GIẢI QUYẾT TRANH CHẤP</div>
            <p className="clause-item"><strong>{t('contractprintpreview.121_negotiation_and_mediation')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.any_disputes_arising_during')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.the_parties_commit_to')}<strong>{t('contractprintpreview.30_thirty')}</strong> {t('contractprintpreview.days_from_the_date')}</li>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.122_court_has_jurisdiction')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.if_a_negotiated_settlement')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.the_decision_of_the')}</li>
            </ul>
          </div>
        </div>

        {/* PAGE 10: MISCELLANEOUS CLAUSES & SIGNATURES */}
        <div className="a4-page">
          <div className="print-content">
            <div className="section-title">13. ĐIỀU KHOẢN CHUNG</div>
            <p className="clause-item"><strong>{t('contractprintpreview.131_contract_validity')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.this_contract_takes_effect')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.any_changes_or_additions')}</li>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.132_notice')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.all_notices_between_the')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.notice_shall_be_deemed')}<strong>03 (ba)</strong> {t('contractprintpreview.days_after_sending_by')}</li>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.133_information_security')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.the_parties_commit_to')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.this_confidentiality_clause_remains')}</li>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.134_integrity_of_the')}</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> {t('contractprintpreview.this_contract_and_its')}</li>
              <li><strong>b.</strong> {t('contractprintpreview.if_any_provision_of')}</li>
            </ul>
            <p className="clause-item"><strong>{t('contractprintpreview.135_number_of_contracts')}</strong> {t('contractprintpreview.this_contract_is_made')}</p>

            <p className="closing-statement" style={{ marginTop: "2rem", fontStyle: "italic", textAlign: "center" }}>
              {t('contractprintpreview.the_parties_have_read')}</p>

            <div className="signature-section" style={{ marginTop: "2.5rem" }}>
              <div className="signature-col">
                <strong>ĐẠI DIỆN BÊN A</strong>
                <span>{t('contractprintpreview.sign_write_full_name')}</span>
                <div className="signature-space"></div>
                <strong>{lessor.representative}</strong>
              </div>
              <div className="signature-col">
                <strong>ĐẠI DIỆN BÊN B</strong>
                <span>{t('contractprintpreview.sign_write_full_name')}</span>
                <div className="signature-space"></div>
                <strong>{contract?.vendorName || "...................................."}</strong>
              </div>
            </div>
          </div>
        </div>

          </div>
        );
      })()}
    </div>,
    document.body
  );
}
