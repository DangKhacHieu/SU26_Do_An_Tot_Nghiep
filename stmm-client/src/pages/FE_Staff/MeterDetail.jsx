import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import readProblemDetail from '../../utils/readProblemDetail';
import { METER_TYPE_MAP, getEnumLabel } from '../../constants/enumMaps';
import './MeterDetail.css';

export default function MeterDetail({ meterId, baseUrl, onBack }) {
  const { t, i18n } = useTranslation();

  const [meter, setMeter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMeterDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${baseUrl}/api/meters/${meterId}`, { headers: getAuthHeaders() });
        if (!response.ok) {
          throw new Error(await readProblemDetail(response, t('meterdetail.unable_to_load_meter')));
        }
        const data = await response.json();
        setMeter(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMeterDetail();
  }, [meterId, baseUrl, t]);

  const formatDate = (dateString) => {
    if (!dateString) return t('meterdetail.na');
    const locale = i18n?.language?.startsWith('vi') ? 'vi-VN' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) return <div className="loading-state">{t('meterdetail.loading_meter_details')}</div>;

  if (error) return (
    <div className="error-state">
      <p className="error-message">Error: {error}</p>
      <button className="btn-secondary" onClick={onBack}>{t('meterdetail.back_to_history')}</button>
    </div>
  );

  if (!meter) return null;

  // Meter type: icon tĩnh, label dịch tại render
  const meterTypeEntry = METER_TYPE_MAP[meter.type];
  const meterTypeIcon = meterTypeEntry ? meterTypeEntry.icon : '🔧';
  const meterTypeLabel = getEnumLabel(meter.type, METER_TYPE_MAP, t);

  return (
    <div className="violation-details-container">
      <div className="details-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>{t('meterdetail.meter_details_label')}: {meter.serialNumber}</h2>
        <button className="btn-secondary-outline" onClick={onBack}>
          {t('meterdetail.back_to_history')}
        </button>
      </div>

      <div className="details-card">
        <div className="details-info-section" style={{ width: '100%' }}>
          <div className="info-block">
            <span className="info-label">{t('meterdetail.serial_number')}</span>
            <span className="info-value stall-code-highlight">{meter.serialNumber}</span>
          </div>

          <div className="info-block">
            <span className="info-label">{t('meterdetail.meter_type')}</span>
            <span className="info-value">
              {/* Icon tĩnh, label dịch tại render */}
              {meterTypeIcon} {meterTypeLabel}
            </span>
          </div>

          <div className="info-block">
            <span className="info-label">{t('meterdetail.stall_code_location')}</span>
            <span className="info-value">{meter.stallCode || `Stall ID: ${meter.stallId}`}</span>
          </div>

          <div className="info-block">
            <span className="info-label">{t('meterdetail.installed_date')}</span>
            <span className="info-value">{formatDate(meter.installedAt)}</span>
          </div>

          <div className="info-block">
            <span className="info-label">{t('meterdetail.status')}</span>
            <div className="status-container">
              {/* CSS class từ boolean isActive — KHÔNG dùng chuỗi dịch */}
              <span className={`status-badge-large ${meter.isActive ? 'approved' : 'rejected'}`}>
                {meter.isActive ? t('meterdetail.active') : t('meterdetail.inactive_replaced')}
              </span>
            </div>
          </div>

          {meter.lastReadingValue !== null && meter.lastReadingValue !== undefined && (
            <div className="info-block" style={{ marginTop: '20px', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
              <span className="info-label">{t('meterdetail.latest_recorded_value')}</span>
              <span className="info-value" style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                {meter.lastReadingValue}
              </span>
            </div>
          )}

          {meter.lastReadingImageUrl && (
            <div className="info-block" style={{ marginTop: '20px', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
              <span className="info-label">{t('meterdetail.latest_reading_evidence_photo')}</span>
              <div className="meter-evidence-photo-container" style={{ marginTop: '10px' }}>
                <img
                  src={meter.lastReadingImageUrl}
                  alt={t('meterdetail.latest_meter_reading_evidence')}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '320px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    display: 'block',
                    objectFit: 'contain'  // CSS property value — KHÔNG dịch
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
