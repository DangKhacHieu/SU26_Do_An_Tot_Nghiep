import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import { VIOLATION_STATUS_MAP, getEnumLabel, getEnumCls } from '../../constants/enumMaps';
import './ViolationDetails.css';

export default function ViolationDetails({ violationId, baseUrl, onBack }) {
  const { t, i18n } = useTranslation();

  const [violation, setViolation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${baseUrl}/api/violations/${violationId}`, { headers: getAuthHeaders() });
        if (!response.ok) {
          let problem = null;
          try { problem = await response.json(); } catch { problem = null; }
          throw new Error(response.status === 404
            ? t('violationdetails.violation_not_found_or')
            : problem?.detail || problem?.title || t('violationdetails.unable_to_load_violation'));
        }
        const data = await response.json();
        setViolation(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [violationId, baseUrl, t]);

  const formatVnd = (amount) => {
    if (amount === undefined || amount === null) return '0 VND';
    const locale = i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US';
    return amount.toLocaleString(locale) + ' VND';
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('violationdetails.na');
    const locale = i18n?.language?.startsWith('vi') ? 'vi-VN' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return t('violationdetails.na');
    const locale = i18n?.language?.startsWith('vi') ? 'vi-VN' : 'en-US';
    return new Date(dateString).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) return <div className="loading-state">{t('violationdetails.loading_violation_details')}</div>;

  if (error) return (
    <div className="error-state">
      <p className="error-message">Error: {error}</p>
      <button className="btn-secondary" onClick={onBack}>{t('violationdetails.back_to_list')}</button>
    </div>
  );

  if (!violation) return null;

  // CSS class từ raw status — KHÔNG dùng chuỗi đã dịch
  const statusCls = getEnumCls(violation.status, VIOLATION_STATUS_MAP, 'pending');
  // Label hiển thị dịch tại render
  const statusLabel = getEnumLabel(violation.status, VIOLATION_STATUS_MAP, t);

  return (
    <div className="violation-details-container">
      <div className="details-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>{t('violationdetails.violation_details_label')}: {violation.violationId}</h2>
        <button className="btn-secondary" onClick={onBack}>
          {t('violationdetails.back_to_list')}
        </button>
      </div>

      <div className="details-card">
        <div className="details-info-section">
          <div className="info-block">
            <span className="info-label">{t('violationdetails.stall_code')}</span>
            <span className="info-value stall-code-highlight">{violation.stallCode || `Stall ID: ${violation.stallId}`}</span>
          </div>

          <div className="info-block">
            <span className="info-label">{t('violationdetails.violation_type')}</span>
            <span className="info-value">{violation.title}</span>
          </div>

          <div className="info-block">
            <span className="info-label">{t('violationdetails.title_violation_summary')}</span>
            <span className="info-value title-val">{violation.title}</span>
          </div>

          <div className="info-block">
            <span className="info-label">{t('violationdetails.description')}</span>
            <span className="info-value desc-val">{violation.description}</span>
          </div>

          <div className="info-row">
            <div className="info-block">
              <span className="info-label">{t('violationdetails.fine_amount')}</span>
              <span className="info-value fine-amount-highlight">{formatVnd(violation.fineAmount)}</span>
            </div>

            <div className="info-block">
              <span className="info-label">{t('violationdetails.date_logged')}</span>
              <span className="info-value">{formatDate(violation.createdAt)}</span>
            </div>
          </div>

          <div className="info-block">
            <span className="info-label">{t('violationdetails.status')}</span>
            <div className="status-container">
              {/* CSS class từ raw status — KHÔNG dùng chuỗi đã dịch */}
              <span className={`status-badge-large ${statusCls}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="details-evidence-section">
          <span className="info-label">{t('violationdetails.evidence_photo')}</span>
          <div className="evidence-photo-box">
            {violation.imageUrl ? (
              <img
                src={violation.imageUrl}
                alt={t('violationdetails.violation_evidence')}
                className="evidence-img"
                onError={(event) => { event.currentTarget.hidden = true; }}
              />
            ) : (
              <div className="no-photo-placeholder">
                <span>{t('violationdetails.no_photo_attached')}</span>
              </div>
            )}
          </div>
          <p className="evidence-note">
            {t('violationdetails.note_this_record_is')}</p>
        </div>
      </div>

      <div className="audit-footer">
        {t('violationdetails.logged_by')}: {t('violationdetails.staff_user', { userId: violation.createdBy })} | {t('violationdetails.timestamp')}: {formatDate(violation.createdAt)} {formatTime(violation.createdAt)}
      </div>
    </div>
  );
}
