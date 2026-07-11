
import { useState, useEffect } from 'react';
import './RequestDetailManager.css';
import {
  MANAGER_QUOTATION_ACTION_OPTIONS,
  OTHER_CONTRACT_CLAUSE,
  REPAIR_RESPONSIBILITY_CLAUSES,
  actionRequiresContractClause,
  actionRequiresDecisionNote
} from '../../constants/repairResponsibilityGuide';


const API_BASE = "http://localhost:5056/api/manager/requests";
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
  FacilityIssue:   { label: 'Sự cố hạ tầng',      cls: 'type-facility'  },
  ViolationAppeal: { label: 'Kháng nghị vi phạm',  cls: 'type-violation' },
  InvoiceDispute:  { label: 'Khiếu nại hóa đơn',   cls: 'type-invoice'   },
};

const STATUS_META = {
  PendingManagerReview: { label: 'Báo giá chờ quyết định', cls: 'status-review' },
  Pending:   { label: 'Chờ xử lý',       cls: 'status-pending'   },
  Quoted:    { label: 'Báo giá',          cls: 'status-quoted'    },
  Approved:  { label: 'Đã duyệt',        cls: 'status-approved'  },
  Completed: { label: 'Hoàn thành',      cls: 'status-completed' },
  Rejected:  { label: 'Từ chối',         cls: 'status-rejected'  },
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

export default function RequestDetailManager({ requestId, navigate, addToast }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState({
    action: '',
    contractClause: '',
    decisionNote: ''
  });

  useEffect(() => {
    if (requestId) fetchRequestDetail();
  }, [requestId]);

  const fetchRequestDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${requestId}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRequest(data);
    } catch {
      addToast('Không thể tải chi tiết yêu cầu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAppeal = async (approve) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/${requestId}/resolve-appeal?approve=${approve}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error();
      addToast(approve ? 'Đã phê duyệt chấp nhận kháng nghị.' : 'Đã bác bỏ kháng nghị.', 'success');
      await fetchRequestDetail();
    } catch {
      addToast('Thao tác thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const updateDecisionField = (field, value) => {
    setDecision(current => ({ ...current, [field]: value }));
  };

  const validateDecision = () => {
    if (!decision.action) {
      return 'Vui lòng chọn quyết định xử lý báo giá.';
    }

    if (actionRequiresContractClause(decision.action) && !decision.contractClause) {
      return 'Vui lòng chọn điều khoản hợp đồng.';
    }

    if (
      actionRequiresDecisionNote(decision.action, decision.contractClause)
      && decision.decisionNote.trim().length < 10
    ) {
      return 'Ghi chú quyết định phải có ít nhất 10 ký tự.';
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
      const res = await fetch(`${API_BASE}/${requestId}/resolve-quotation`, {
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
        try {
          const problem = JSON.parse(errorText);
          throw new Error(problem.detail || problem.message || 'Thao tác thất bại.');
        } catch (parseError) {
          if (parseError instanceof SyntaxError) {
            throw new Error(errorText || 'Thao tác thất bại.');
          }
          throw parseError;
        }
      }

      const selectedAction = MANAGER_QUOTATION_ACTION_OPTIONS.find(
        option => option.value === decision.action
      );
      addToast(`Đã xử lý: ${selectedAction?.label || decision.action}.`, 'success');
      setDecision({ action: '', contractClause: '', decisionNote: '' });
      await fetchRequestDetail();
    } catch (err) {
      addToast(err.message || 'Thao tác thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (s) => {
    if (!s) return '—';
    try {
      return new Date(s).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return s; }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="rd-loading">
        <div className="rd-spinner" />
        <span>Đang tải thông tin chi tiết...</span>
      </div>
    );
  }

  /* ── Not Found ── */
  if (!request) {
    return (
      <div className="rd-not-found">
        <h3>Không tìm thấy yêu cầu</h3>
        <p>Yêu cầu không tồn tại hoặc đã bị xóa.</p>
        <button className="rd-back-btn" onClick={() => navigate('requests')}>
          <IconArrowLeft /> Quay lại danh sách
        </button>
      </div>
    );
  }

  const tm = TYPE_META[request.requestType]  || { label: request.requestType, cls: 'type-other' };
  const sm = STATUS_META[request.status]     || { label: request.status,      cls: 'status-pending' };
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
            <IconArrowLeft /> Danh sách yêu cầu
          </button>

          <div className="rd-header-badges">
            <span className={`rd-type-badge ${tm.cls}`}>{tm.label}</span>
            <span className={`rd-status-badge ${sm.cls}`}>{sm.label}</span>
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
              <span>Tạo lúc: <strong>{formatDate(request.createdAt)}</strong></span>
            </div>
            {request.updatedAt && request.updatedAt !== request.createdAt && (
              <div className="rd-meta-item">
                <IconCalendar />
                <span>Cập nhật: <strong>{formatDate(request.updatedAt)}</strong></span>
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
              <span>Nội dung yêu cầu</span>
            </div>
            <div className="rd-desc-box">
              {request.description || '(Không có mô tả)'}
            </div>
          </div>

          {/* Reference Links */}
          {hasReference && (
            <div className="rd-card">
              <div className="rd-card-header">
                <IconLink />
                <span>Thông tin liên quan</span>
              </div>
              <div className="rd-refs">
                {request.violationId && (
                  <div className="rd-ref-item rd-ref-violation">
                    <span className="rd-ref-label">Biên bản vi phạm</span>
                    <span className="rd-ref-code">#VIO-{request.violationId}</span>
                  </div>
                )}
                {request.invoiceId && (
                  <div className="rd-ref-item rd-ref-invoice">
                    <span className="rd-ref-label">Hóa đơn thanh toán</span>
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
                <span>Báo giá & Chi phí dự kiến</span>
              </div>

              <div className="rd-quote-amount-row">
                <div>
                  <p className="rd-field-label">Tổng chi phí dự kiến</p>
                  <p className="rd-quote-amount">{formatCurrency(request.quotationAmount)}</p>
                </div>
                <div className="rd-quote-meta-grid">
                  <div>
                    <p className="rd-field-label">Đối tượng chi trả</p>
                    <p className="rd-field-value">
                      {request.paidBy === 'Vendor' ? 'Tiểu thương chịu'
                        : request.paidBy === 'Market' ? 'Chợ chịu'
                        : 'Chưa quyết định'}
                    </p>
                  </div>
                  <div>
                    <p className="rd-field-label">Trạng thái duyệt</p>
                    <span className={`rd-approval-badge ${
                      request.isQuoteApproved === true  ? 'approved'
                        : request.isQuoteApproved === false ? 'rejected'
                        : 'pending'
                    }`}>
                      {request.isQuoteApproved === true  ? 'Đã duyệt'
                        : request.isQuoteApproved === false ? 'Từ chối'
                        : 'Đang chờ'}
                    </span>
                  </div>
                </div>
              </div>

              {request.quotationText && (
                <div className="rd-quote-text-wrap">
                  <p className="rd-field-label">Chi tiết hạng mục & vật tư</p>
                  <div className="rd-quote-text">{request.quotationText}</div>
                </div>
              )}

              {(request.payerContractClause || request.payerDecisionNote) && (
                <div className="rd-decision-summary">
                  {request.payerContractClause && (
                    <p><strong>Điều khoản:</strong> {request.payerContractClause}</p>
                  )}
                  {request.payerDecisionNote && (
                    <p><strong>Ghi chú Manager:</strong> {request.payerDecisionNote}</p>
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
                <span style={{ fontWeight: '700' }}>Xử lý Kháng nghị Vi phạm</span>
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
                  <IconCheck /> Chấp nhận kháng nghị
                </button>
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
                  <IconX /> Bác bỏ kháng nghị
                </button>
              </div>
            </div>
          )}

          {canResolveQuotation && (
            <div className="rd-card rd-decision-card">
              <div className="rd-card-header rd-decision-card-header">
                <IconTool />
                <span>Quyết định báo giá sửa chữa</span>
              </div>

              {request.vendorRejectReason && (
                <div className="rd-vendor-reject-reason">
                  <strong>Lý do Vendor từ chối:</strong>
                  <span>{request.vendorRejectReason}</span>
                </div>
              )}

              <div className="rd-decision-form">
                <label className="rd-decision-field">
                  <span>Hướng xử lý</span>
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
                    <option value="">-- Chọn quyết định --</option>
                    {MANAGER_QUOTATION_ACTION_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {requiresContractClause && (
                  <label className="rd-decision-field">
                    <span>Điều khoản hợp đồng</span>
                    <select
                      value={decision.contractClause}
                      onChange={event => updateDecisionField('contractClause', event.target.value)}
                      disabled={submitting}
                    >
                      <option value="">-- Chọn điều khoản --</option>
                      {REPAIR_RESPONSIBILITY_CLAUSES.map(clause => (
                        <option key={clause} value={clause}>{clause}</option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="rd-decision-field">
                  <span>
                    Ghi chú quyết định
                    {requiresDecisionNote ? ' (bắt buộc, tối thiểu 10 ký tự)' : ' (tùy chọn)'}
                  </span>
                  <textarea
                    rows="4"
                    maxLength="1000"
                    value={decision.decisionNote}
                    onChange={event => updateDecisionField('decisionNote', event.target.value)}
                    placeholder={
                      decision.contractClause === OTHER_CONTRACT_CLAUSE
                        ? 'Nêu rõ căn cứ quyết định...'
                        : 'Nhập ghi chú cho Staff hoặc Vendor...'
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
                  {submitting ? 'Đang xử lý...' : 'Xác nhận quyết định'}
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
                  <span>Đang chờ Tiểu thương xác nhận báo giá</span>
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
              <span>Thông tin đối tác</span>
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
                <p className="rd-field-label">Mã quầy sạp</p>
                <span className="rd-stall-badge">{request.stallCode || '—'}</span>
              </div>
            </div>
          </div>

          {/* Timestamps card */}
          <div className="rd-card">
            <div className="rd-card-header">
              <IconCalendar />
              <span>Thời gian</span>
            </div>
            <div className="rd-fields">
              <div className="rd-field-row">
                <p className="rd-field-label">Ngày tạo yêu cầu</p>
                <p className="rd-field-value">{formatDate(request.createdAt)}</p>
              </div>
              <div className="rd-field-row">
                <p className="rd-field-label">Cập nhật cuối</p>
                <p className="rd-field-value">{formatDate(request.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Rating card */}
          {hasRating && (
            <div className="rd-card rd-rating-card">
              <div className="rd-card-header">
                <IconStar filled={true} />
                <span>Đánh giá của tiểu thương</span>
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
                  <p className="rd-field-label">Nhận xét</p>
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
