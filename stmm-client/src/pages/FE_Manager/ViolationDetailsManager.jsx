import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import './ViolationDetailsManager.css';

const STATUS_META = {
  Pending:   { label: 'Chờ duyệt',    cls: 'status-pending'   },
  Notified:  { label: 'Đã thông báo', cls: 'status-notified'  },
  Appealed:  { label: 'Kháng nghị',   cls: 'status-appealed'  },
  Finalized: { label: 'Đã kết luận',  cls: 'status-finalized' },
  Approved:  { label: 'Chấp nhận',    cls: 'status-approved'  },
  Rejected:  { label: 'Bị bác bỏ',    cls: 'status-rejected'  },
};

const APPEAL_STATUS_META = {
  Pending:   { label: 'Chờ xử lý',  cls: 'appeal-pending'  },
  Approved:  { label: 'Chấp nhận',  cls: 'appeal-approved' },
  Rejected:  { label: 'Từ chối',   cls: 'appeal-rejected' },
};

/* ── Icons ── */
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
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

export default function ViolationDetailsManager({ violationId, baseUrl, navigate, addToast }) {
  const { t } = useTranslation();

  const [violation, setViolation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const apiViolation = `${baseUrl || "http://localhost:5056"}/api/manager/violations`;
  const apiAppeal = `${baseUrl || "http://localhost:5056"}/api/manager/requests`;

  useEffect(() => {
    if (violationId) {
      fetchViolationDetails();
    }
  }, [violationId]);

  const fetchViolationDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiViolation}/${violationId}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setViolation(data);
    } catch {
      addToast(t('violationdetailsmanager.unable_to_download_details'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAppeal = async (requestId, approve) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${apiAppeal}/${requestId}/resolve-appeal?approve=${approve}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      
      addToast(approve ? t('violationdetailsmanager.approved_to_accept_the') : t('violationdetailsmanager.the_appeal_was_dismissed'), 'success');
      await fetchViolationDetails(); // Refresh details to show updated status
    } catch {
      addToast(t('violationdetailsmanager.operation_failed_please_try'), 'error');
    } finally {
      setSubmitting(false);
    }
  };



  const formatVnd = (amount) => {
    if (amount === undefined || amount === null) return '—';
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="vd-loading">
        <div className="vd-spinner" />
        <span>{t('violationdetailsmanager.loading_details')}</span>
      </div>
    );
  }

  if (!violation) {
    return (
      <div className="vd-not-found">
        <h3>{t('violationdetailsmanager.no_violation_records_found')}</h3>
        <button className="vd-back-btn" onClick={() => navigate('violations')}>
          <IconArrowLeft /> {t('violationdetailsmanager.back_to_the_list')}</button>
      </div>
    );
  }

  const sm = STATUS_META[violation.status] || { label: violation.status, cls: 'status-pending' };
  
  // Find any associated appeal request
  const appealRequest = violation.requests?.find(r => r.requestType === 'ViolationAppeal');

  return (
    <div className="vd-container">
      {/* ── Header Card ── */}
      <div className="vd-header-card">
        <div className="vd-header-accent" />
        <div className="vd-header-top">
          <button className="vd-back-btn" onClick={() => navigate('violations')}>
            <IconArrowLeft /> {t('violationdetailsmanager.list_of_violations')}</button>
          <span className={`vd-status-badge ${sm.cls}`}>
            {sm.label}
          </span>
        </div>
        <div className="vd-header-body">
          <p className="vd-vio-id">VIO-{violation.violationId}</p>
          <h2 className="vd-vio-title">{violation.title}</h2>
          <div className="vd-meta-row">
            <span>{t('violationdetailsmanager.date_of_establishment')}<strong>{formatDate(violation.createdAt)}</strong></span>
            <span>{t('violationdetailsmanager.last_update')}<strong>{formatDate(violation.updatedAt)}</strong></span>
          </div>
        </div>
      </div>

      {/* ── Details Grid ── */}
      <div className="vd-grid">
        {/* Left Column: Details */}
        <div className="vd-col-left">
          <div className="vd-card">
            <h3 className="vd-card-title">{t('violationdetailsmanager.violation_details')}</h3>
            <div className="vd-details-list">
              <div className="vd-detail-item">
                <span className="vd-detail-label">{t('violationdetailsmanager.describe')}</span>
                <p className="vd-detail-desc">{violation.description || t('violationdetailsmanager.no_description')}</p>
              </div>
              <div className="vd-detail-item-grid">
                <div>
                  <span className="vd-detail-label">{t('violationdetailsmanager.stall_code')}</span>
                  <p className="vd-detail-val"><span className="vd-stall-badge">{violation.stallCode}</span></p>
                </div>
                <div>
                  <span className="vd-detail-label">{t('violationdetailsmanager.fine_amount')}</span>
                  <p className="vd-detail-val vd-fine-amount">{formatVnd(violation.fineAmount)}</p>
                </div>
                <div>
                  <span className="vd-detail-label">{t('violationdetailsmanager.minute_maker')}</span>
                  <p className="vd-detail-val">Staff #{violation.createdBy}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Appeal Processing Card ── */}
          {appealRequest && (
            <div className="vd-card vd-appeal-card">
              <div className="vd-appeal-header">
                <h3 className="vd-card-title">{t('violationdetailsmanager.protest_by_small_businesses')}</h3>
                <span className={`vd-appeal-status-badge ${(APPEAL_STATUS_META[appealRequest.status] || {cls: ''}).cls}`}>
                  {(APPEAL_STATUS_META[appealRequest.status] || {label: appealRequest.status}).label}
                </span>
              </div>
              <div className="vd-appeal-body">
                <p className="vd-appeal-title"><strong>{t('violationdetailsmanager.title')}</strong> {appealRequest.title}</p>
                <div className="vd-appeal-desc-box">
                  {appealRequest.description}
                </div>
                <p className="vd-appeal-date">Gửi lúc: {formatDate(appealRequest.createdAt)}</p>

                {/* Approve/Reject Buttons */}
                {appealRequest.status === 'Pending' && (
                  <div className="vd-appeal-actions">
                    <button
                      className="vd-btn-approve"
                      disabled={submitting}
                      onClick={() => handleResolveAppeal(appealRequest.requestId, true)}
                    >
                      <IconCheck /> {t('violationdetailsmanager.accept_the_appeal')}</button>
                    <button
                      className="vd-btn-reject"
                      disabled={submitting}
                      onClick={() => handleResolveAppeal(appealRequest.requestId, false)}
                    >
                      <IconX /> {t('violationdetailsmanager.rejected_the_appeal')}</button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Evidence Photo */}
        <div className="vd-col-right">
          <div className="vd-card">
            <h3 className="vd-card-title">{t('violationdetailsmanager.evidence_images')}</h3>
            <div className="vd-image-container">
              {violation.imageUrl ? (
                <img
                  src={violation.imageUrl}
                  alt={t('violationdetailsmanager.evidence_of_violation')}
                  className="vd-evidence-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/400x300?text=No+Image+Found';
                  }}
                />
              ) : (
                <div className="vd-no-image">
                  <span>{t('violationdetailsmanager.there_is_no_photo')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
