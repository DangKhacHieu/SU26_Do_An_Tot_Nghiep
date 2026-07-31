import { useTranslation } from 'react-i18next';

import { useState, useEffect, useCallback } from 'react';
import './RequestDetailManager.css';
import {
  MANAGER_QUOTATION_ACTION_OPTIONS,
  OTHER_CONTRACT_CLAUSE,
  REPAIR_RESPONSIBILITY_CLAUSES,
  actionRequiresContractClause,
  actionRequiresDecisionNote
} from '../../constants/repairResponsibilityGuide';


const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`
});

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const TYPE_META = {
  FacilityIssue:   { labelKey: 'infrastructure_failure', labelFallback: 'Sự cố hạ tầng',      cls: 'type-facility'  },
  ViolationAppeal: { labelKey: 'protest_violations',      labelFallback: 'Kháng nghị vi phạm',  cls: 'type-violation' },
  InvoiceDispute:  { labelKey: 'invoice_complaints',     labelFallback: 'Khiếu nại hóa đơn',   cls: 'type-invoice'   },
};

const STATUS_META = {
  PendingManagerReview: { labelKey: 'quote_awaiting_decision', labelFallback: 'Báo giá chờ quyết định', cls: 'status-review' },
  Pending:   { labelKey: 'waiting_for_processing', labelFallback: 'Chờ xử lý',       cls: 'status-pending'   },
  Quoted:    { labelKey: 'quote',                  labelFallback: 'Báo giá',          cls: 'status-quoted'    },
  Approved:  { labelKey: 'approved',               labelFallback: 'Đã duyệt',        cls: 'status-approved'  },
  Completed: { labelKey: 'complete',               labelFallback: 'Hoàn thành',      cls: 'status-completed' },
  Rejected:  { labelKey: 'refuse',                 labelFallback: 'Từ chối',         cls: 'status-rejected'  },
};

/* ── Icons ── */
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconTool = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);
const IconLink = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);
const IconStar = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill={filled ? "#fbbf24" : "none"}
    stroke={filled ? "#fbbf24" : "#374151"}
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

export default function RequestDetailManager({ requestId, baseUrl, navigate, addToast }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US';

  const requestApiBase = `${baseUrl}/api/manager/requests`;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState({
    action: '',
    contractClause: '',
    decisionNote: ''
  });

  const fetchRequestDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${requestApiBase}/${requestId}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRequest(data);
    } catch {
      addToast(t('requestdetailmanager.unable_to_load_request'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, requestApiBase, requestId, t]);

  useEffect(() => {
    if (requestId) fetchRequestDetail();
  }, [fetchRequestDetail, requestId]);

  const handleResolveAppeal = async (approve) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${requestApiBase}/${requestId}/resolve-appeal?approve=${approve}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error();
      addToast(approve ? t('requestdetailmanager.approved_to_accept_the') : t('requestdetailmanager.the_appeal_was_dismissed'), 'success');
      await fetchRequestDetail();
    } catch {
      addToast(t('requestdetailmanager.operation_failed_please_try'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const updateDecisionField = (field, value) => {
    setDecision(current => ({ ...current, [field]: value }));
  };

  const validateDecision = () => {
    if (!decision.action) {
      return t('requestdetailmanager.please_select_the_quote');
    }

    if (actionRequiresContractClause(decision.action) && !decision.contractClause) {
      return t('requestdetailmanager.please_select_contract_terms');
    }

    if (
      actionRequiresDecisionNote(decision.action, decision.contractClause)
      && decision.decisionNote.trim().length < 10
    ) {
      return t('requestdetailmanager.decision_notes_must_be');
    }

    return null;
  };

  const handleResolveQuotation = async () => {
    const validationMessage = validateDecision();
    if (validationMessage) {
      addToast(validationMessage, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${requestApiBase}/${requestId}/resolve-quotation`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: decision.action,
          contractClause: decision.contractClause || null,
          decisionNote: decision.decisionNote.trim() || null
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = errorText || t('requestdetailmanager.operation_failed');
        try {
          const problem = JSON.parse(errorText);
          errorMessage = problem.detail || problem.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const selectedAction = MANAGER_QUOTATION_ACTION_OPTIONS.find(
        option => option.value === decision.action
      );
      addToast(`Đã xử lý: ${selectedAction?.label || decision.action}.`, 'success');
      setDecision({ action: '', contractClause: '', decisionNote: '' });
      await fetchRequestDetail();
    } catch (err) {
      addToast(err.message || t('requestdetailmanager.operation_failed_please_try'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (s) => {
    if (!s) return '—';
    try {
      return new Date(s).toLocaleString(locale, {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return s; }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '—';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'VND' }).format(amount);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="rd-loading">
        <div className="rd-spinner" />
        <span>{t('requestdetailmanager.loading_details')}</span>
      </div>
    );
  }

  /* ── Not Found ── */
  if (!request) {
    return (
      <div className="rd-not-found">
        <h3>{t('requestdetailmanager.no_request_found')}</h3>
        <p>{t('requestdetailmanager.the_request_does_not')}</p>
        <button className="rd-back-btn" onClick={() => navigate('requests')}>
          <IconArrowLeft /> {t('requestdetailmanager.back_to_the_list')}</button>
      </div>
    );
  }

  const tm = TYPE_META[request.requestType]  || { labelKey: '', labelFallback: request.requestType, cls: 'type-other' };
  const sm = STATUS_META[request.status]     || { labelKey: '', labelFallback: request.status,      cls: 'status-pending' };
  const hasQuotation = request.quotationText || request.quotationAmount !== null && request.quotationAmount !== undefined;
  const hasReference = request.violationId   || request.invoiceId;
  const hasRating    = request.status === 'Completed' && (request.repairRating !== null || request.repairComment);
  const canResolveQuotation = request.requestType === 'FacilityIssue'
    && request.status === 'PendingManagerReview';
  const requiresContractClause = actionRequiresContractClause(decision.action);
  const requiresDecisionNote = actionRequiresDecisionNote(
    decision.action,
    decision.contractClause
  );

  return (
    <div className="rd-container">
      {/* ── Header ── */}
      <div className="rd-header-card">
        <div className="rd-header-accent" />

        <div className="rd-header-top">
          <button className="rd-back-btn" onClick={() => navigate('requests')}>
            <IconArrowLeft /> {t('requestdetailmanager.list_of_requests')}</button>

          <div className="rd-header-badges">
            <span className={`rd-type-badge ${tm.cls}`}>{tm.labelKey ? t('requestdetailmanager.' + tm.labelKey) : tm.labelFallback}</span>
            <span className={`rd-status-badge ${sm.cls}`}>{sm.labelKey ? t('requestdetailmanager.' + sm.labelKey) : sm.labelFallback}</span>
          </div>
        </div>

        <div className="rd-header-body">
          <div>
            <p className="rd-req-id">REQ-{request.requestId}</p>
            <h2 className="rd-req-title">{request.title}</h2>
          </div>

          <div className="rd-header-meta">
            <div className="rd-meta-item">
              <IconCalendar />
              <span>{t('requestdetailmanager.created_at')}<strong>{formatDate(request.createdAt)}</strong></span>
            </div>
            {request.updatedAt && request.updatedAt !== request.createdAt && (
              <div className="rd-meta-item">
                <IconCalendar />
                <span>{t('requestdetailmanager.update')}<strong>{formatDate(request.updatedAt)}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="rd-grid">
        {/* ── Left Column ── */}
        <div className="rd-col-left">

          {/* Request Description */}
          <div className="rd-card">
            <div className="rd-card-header">
              <IconInfo />
              <span>{t('requestdetailmanager.request_content')}</span>
            </div>
            <div className="rd-desc-box">
              {request.description || t('requestdetailmanager.no_description')}
            </div>
          </div>

          {/* Reference Links */}
          {hasReference && (
            <div className="rd-card">
              <div className="rd-card-header">
                <IconLink />
                <span>{t('requestdetailmanager.related_information')}</span>
              </div>
              <div className="rd-refs">
                {request.violationId && (
                  <div className="rd-ref-item rd-ref-violation">
                    <span className="rd-ref-label">{t('requestdetailmanager.violation_record')}</span>
                    <span className="rd-ref-code">#VIO-{request.violationId}</span>
                  </div>
                )}
                {request.invoiceId && (
                  <div className="rd-ref-item rd-ref-invoice">
                    <span className="rd-ref-label">{t('requestdetailmanager.payment_invoice')}</span>
                    <span className="rd-ref-code">#INV-{request.invoiceId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quotation */}
          {hasQuotation && (
            <div className="rd-card rd-quote-card">
              <div className="rd-card-header">
                <IconTool />
                <span>{t('requestdetailmanager.quote_estimated_cost')}</span>
              </div>

              <div className="rd-quote-amount-row">
                <div>
                  <p className="rd-field-label">{t('requestdetailmanager.total_expected_cost')}</p>
                  <p className="rd-quote-amount">{formatCurrency(request.quotationAmount)}</p>
                </div>
                <div className="rd-quote-meta-grid">
                  <div>
                    <p className="rd-field-label">{t('requestdetailmanager.paying_object')}</p>
                    <p className="rd-field-value">
                      {request.paidBy === 'Vendor' ? t('requestdetailmanager.small_businesses_accept')
                        : request.paidBy === 'Market' ? t('requestdetailmanager.the_market_accepts')
                        : t('requestdetailmanager.havent_decided_yet')}
                    </p>
                  </div>
                  <div>
                    <p className="rd-field-label">{t('requestdetailmanager.browsing_status')}</p>
                    <span className={`rd-approval-badge ${
                      request.isQuoteApproved === true  ? 'approved'
                        : request.isQuoteApproved === false ? 'rejected'
                        : 'pending'
                    }`}>
                      {request.isQuoteApproved === true  ? t('requestdetailmanager.approved')
                        : request.isQuoteApproved === false ? t('requestdetailmanager.refuse')
                        : t('requestdetailmanager.waiting')}
                    </span>
                  </div>
                </div>
              </div>

              {request.quotationText && (
                <div className="rd-quote-text-wrap">
                  <p className="rd-field-label">{t('requestdetailmanager.details_of_items_materials')}</p>
                  <div className="rd-quote-text">{request.quotationText}</div>
                </div>
              )}

              {(request.payerContractClause || request.payerDecisionNote) && (
                <div className="rd-decision-summary">
                  {request.payerContractClause && (
                    <p><strong>{t('requestdetailmanager.clause')}</strong> {request.payerContractClause}</p>
                  )}
                  {request.payerDecisionNote && (
                    <p><strong>{t('requestdetailmanager.manager_notes')}</strong> {request.payerDecisionNote}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action section for Violation Appeal */}
          {request.requestType === 'ViolationAppeal' && request.status === 'Pending' && (
            <div className="rd-card rd-action-card" style={{ borderLeft: '4px solid #8b5cf6', background: '#faf5ff' }}>
              <div className="rd-card-header" style={{ color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconInfo />
                <span style={{ fontWeight: '700' }}>{t('requestdetailmanager.handling_violation_appeals')}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  disabled={submitting}
                  onClick={() => handleResolveAppeal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    flex: 1,
                    background: '#10b981',
                    color: '#ffffff',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.15)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { if(!submitting) e.currentTarget.style.backgroundColor = '#059669'; }}
                  onMouseLeave={(e) => { if(!submitting) e.currentTarget.style.backgroundColor = '#10b981'; }}
                >
                  <IconCheck /> {t('requestdetailmanager.accept_the_appeal')}</button>
                <button
                  disabled={submitting}
                  onClick={() => handleResolveAppeal(false)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    flex: 1,
                    background: '#ef4444',
                    color: '#ffffff',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.15)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { if(!submitting) e.currentTarget.style.backgroundColor = '#dc2626'; }}
                  onMouseLeave={(e) => { if(!submitting) e.currentTarget.style.backgroundColor = '#ef4444'; }}
                >
                  <IconX /> {t('requestdetailmanager.rejected_the_appeal')}</button>
              </div>
            </div>
          )}

          {canResolveQuotation && (
            <div className="rd-card rd-decision-card">
              <div className="rd-card-header rd-decision-card-header">
                <IconTool />
                <span>{t('requestdetailmanager.decide_on_a_repair')}</span>
              </div>

              {request.vendorRejectReason && (
                <div className="rd-vendor-reject-reason">
                  <strong>{t('requestdetailmanager.reason_for_vendor_refusal')}</strong>
                  <span>{request.vendorRejectReason}</span>
                </div>
              )}

              <div className="rd-decision-form">
                <label className="rd-decision-field">
                  <span>{t('requestdetailmanager.processing_direction')}</span>
                  <select
                    value={decision.action}
                    onChange={event => {
                      const action = event.target.value;
                      setDecision(current => ({
                        ...current,
                        action,
                        contractClause: actionRequiresContractClause(action)
                          ? current.contractClause
                          : ''
                      }));
                    }}
                    disabled={submitting}
                  >
                    <option value="">{t('requestdetailmanager.choose_a_decision')}</option>
                    {MANAGER_QUOTATION_ACTION_OPTIONS.map(option => {
                      let label = option.label;
                      if (option.value === 'ApproveAsMarket') label = t('repairresponsibilityguide.the_market_pays_the');
                      else if (option.value === 'SendToVendor') label = t('repairresponsibilityguide.small_businesses_pay_the');
                      else if (option.value === 'ReturnForRevision') label = t('repairresponsibilityguide.pay_staff_to_edit');
                      else if (option.value === 'Reject') label = t('repairresponsibilityguide.refuse_repair_request');
                      return (
                        <option key={option.value} value={option.value}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </label>

                {requiresContractClause && (
                  <label className="rd-decision-field">
                    <span>{t('requestdetailmanager.contract_terms')}</span>
                    <select
                      value={decision.contractClause}
                      onChange={event => updateDecisionField('contractClause', event.target.value)}
                      disabled={submitting}
                    >
                      <option value="">{t('requestdetailmanager.select_terms')}</option>
                      {REPAIR_RESPONSIBILITY_CLAUSES.map(clause => {
                        let label = clause;
                        if (clause === 'Khác / Không áp dụng điều khoản cụ thể') {
                          label = t('repairresponsibilityguide.khc_khng_p_dng');
                        } else if (clause === 'Hư hỏng do hao mòn tự nhiên hoặc tài sản chung của chợ') {
                          label = t('repairresponsibilityguide.damage_due_to_natural');
                        } else if (clause === 'Hư hỏng phát sinh trong quá trình sử dụng của tiểu thương') {
                          label = t('repairresponsibilityguide.damage_arising_during_use');
                        } else if (clause === 'Sửa chữa hoặc cải tạo theo yêu cầu riêng của tiểu thương') {
                          label = t('repairresponsibilityguide.repair_or_renovate_according');
                        }
                        return <option key={clause} value={clause}>{label}</option>;
                      })}
                    </select>
                  </label>
                )}

                <label className="rd-decision-field">
                  <span>
                    Ghi chú quyết định
                    {requiresDecisionNote ? t('requestdetailmanager.required_minimum_10_characters') : t('requestdetailmanager.optional')}
                  </span>
                  <textarea
                    rows="4"
                    maxLength="1000"
                    value={decision.decisionNote}
                    onChange={event => updateDecisionField('decisionNote', event.target.value)}
                    placeholder={
                      decision.contractClause === OTHER_CONTRACT_CLAUSE
                        ? t('requestdetailmanager.clearly_state_the_basis')
                        : t('requestdetailmanager.enter_notes_for_staff')
                    }
                    disabled={submitting}
                  />
                </label>

                <button
                  type="button"
                  className="rd-decision-submit"
                  onClick={handleResolveQuotation}
                  disabled={submitting || !decision.action}
                >
                  {submitting ? t('requestdetailmanager.processing') : t('requestdetailmanager.confirm_the_decision')}
                </button>
              </div>
            </div>
          )}

          {request.requestType === 'FacilityIssue'
            && request.status === 'Quoted'
            && request.paidBy === 'Vendor'
            && request.isQuoteApproved === null && (
              <div className="rd-card rd-vendor-waiting-card">
                <div className="rd-card-header">
                  <IconInfo />
                  <span>{t('requestdetailmanager.waiting_for_merchant_to')}</span>
                </div>
              </div>
            )}
        </div>

        {/* ── Right Column ── */}
        <div className="rd-col-right">

          {/* Vendor & Stall */}
          <div className="rd-card">
            <div className="rd-card-header">
              <IconUser />
              <span>{t('requestdetailmanager.partner_information')}</span>
            </div>

            <div className="rd-vendor-block">
              <div className="rd-vendor-avatar">
                {(request.vendorName || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="rd-vendor-name">{request.vendorName || '—'}</p>
                <p className="rd-vendor-biz">{request.businessName || '—'}</p>
              </div>
            </div>

            <div className="rd-fields">
              <div className="rd-field-row">
                <p className="rd-field-label">{t('requestdetailmanager.stall_code')}</p>
                <span className="rd-stall-badge">{request.stallCode || '—'}</span>
              </div>
            </div>
          </div>

          {/* Timestamps card */}
          <div className="rd-card">
            <div className="rd-card-header">
              <IconCalendar />
              <span>{t('requestdetailmanager.time')}</span>
            </div>
            <div className="rd-fields">
              <div className="rd-field-row">
                <p className="rd-field-label">{t('requestdetailmanager.request_creation_date')}</p>
                <p className="rd-field-value">{formatDate(request.createdAt)}</p>
              </div>
              <div className="rd-field-row">
                <p className="rd-field-label">{t('requestdetailmanager.last_updated')}</p>
                <p className="rd-field-value">{formatDate(request.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Rating card */}
          {hasRating && (
            <div className="rd-card rd-rating-card">
              <div className="rd-card-header">
                <IconStar filled={true} />
                <span>{t('requestdetailmanager.reviews_from_small_businesses')}</span>
              </div>

              {request.repairRating !== null && (
                <div className="rd-stars-row">
                  {[1,2,3,4,5].map(s => (
                    <IconStar key={s} filled={s <= request.repairRating} />
                  ))}
                  <span className="rd-rating-num">{request.repairRating}/5</span>
                </div>
              )}

              {request.repairComment && (
                <div className="rd-comment-box">
                  <p className="rd-field-label">{t('requestdetailmanager.comment')}</p>
                  <p className="rd-comment-text">"{request.repairComment}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
