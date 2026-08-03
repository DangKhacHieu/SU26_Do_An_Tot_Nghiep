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

  if (loading) {
    return (
      <div className="meter-detail-wrapper">
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <div className="loading-spinner" style={{ marginBottom: '12px', fontSize: '24px' }}>⏳</div>
          <p style={{ margin: 0, fontWeight: '600' }}>{t('meterdetail.loading_meter_details')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meter-detail-wrapper">
        <div style={{ padding: '32px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#991b1b' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>⚠️ Error</h3>
          <p style={{ margin: '0 0 16px 0' }}>{error}</p>
          <button className="meter-back-btn" onClick={onBack}>
            ← {t('meterdetail.back_to_history')}
          </button>
        </div>
      </div>
    );
  }

  if (!meter) return null;

  // Meter type & unit properties
  const meterTypeEntry = METER_TYPE_MAP[meter.type];
  const meterTypeIcon = meterTypeEntry ? meterTypeEntry.icon : '🔧';
  const meterTypeLabel = getEnumLabel(meter.type, METER_TYPE_MAP, t);
  const isWater = meter.type === 'Water' || meter.type === 1;
  const unitLabel = isWater ? 'm³' : 'kWh';
  const typeClass = isWater ? 'type-water' : 'type-electricity';

  return (
    <div className="meter-detail-wrapper">
      {/* Header Action Bar */}
      <div className="meter-detail-header">
        <div className="meter-header-left">
          <button className="meter-back-btn" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            {t('meterdetail.back_to_history')}
          </button>
          <h2 className="meter-header-title">
            {t('meterdetail.meter_details_label')}
            <span className="meter-serial-tag">{meter.serialNumber}</span>
          </h2>
        </div>
      </div>

      {/* Hero Badge Banner */}
      <div className={`meter-hero-card ${typeClass}`}>
        <div className="meter-hero-main">
          <div className="meter-type-avatar">
            {meterTypeIcon}
          </div>
          <div className="meter-hero-meta">
            <h3>{meterTypeLabel} ({unitLabel})</h3>
            <p className="meter-hero-subtitle">
              <span>📍 {meter.stallId ? (meter.stallCode || `Stall ID: ${meter.stallId}`) : t('meterdetail.in_warehouse', 'Chưa lắp đặt (trong kho)')}</span>
              <span>•</span>
              <span>📅 {formatDate(meter.installedAt)}</span>
            </p>
          </div>
        </div>

        <div className={`meter-status-pill ${meter.isActive ? 'active' : 'inactive'}`}>
          <span className="status-dot"></span>
          <span>{meter.isActive ? t('meterdetail.active') : t('meterdetail.inactive_replaced')}</span>
        </div>
      </div>

      {/* Main 2-Column Responsive Grid */}
      <div className="meter-detail-grid">
        {/* Left Pane: KPI Stat & Specifications */}
        <div className="meter-pane">
          {/* Latest Recorded Value Stat KPI Card */}
          {meter.lastReadingValue !== null && meter.lastReadingValue !== undefined && (
            <div className="meter-kpi-card">
              <div className="meter-kpi-label">
                📊 {t('meterdetail.latest_recorded_value')}
              </div>
              <div className="meter-kpi-body">
                <span className="meter-kpi-value">{meter.lastReadingValue}</span>
                <span className="meter-kpi-unit">{unitLabel}</span>
              </div>
              <div className="meter-kpi-footer">
                <span>⏱️ Updated from latest utility reading</span>
              </div>
            </div>
          )}

          {/* Technical Specifications Grid */}
          <div className="meter-card">
            <div className="meter-card-header">
              <h4 className="meter-card-title">
                📋 Meter Information
              </h4>
            </div>

            <div className="meter-info-grid">
              <div className="meter-info-item">
                <span className="meter-info-label">🔢 {t('meterdetail.serial_number')}</span>
                <span className="meter-info-value mono">{meter.serialNumber}</span>
              </div>

              <div className="meter-info-item">
                <span className="meter-info-label">⚡ {t('meterdetail.meter_type')}</span>
                <span className="meter-info-value">{meterTypeIcon} {meterTypeLabel}</span>
              </div>

              <div className="meter-info-item">
                <span className="meter-info-label">📍 {t('meterdetail.stall_code_location')}</span>
                <span className="meter-info-value">{meter.stallId ? (meter.stallCode || `Stall ID: ${meter.stallId}`) : t('meterdetail.in_warehouse', 'Chưa lắp đặt (trong kho)')}</span>
              </div>

              <div className="meter-info-item">
                <span className="meter-info-label">📅 {t('meterdetail.installed_date')}</span>
                <span className="meter-info-value">{formatDate(meter.installedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Reading Evidence Photo */}
        <div className="meter-pane">
          <div className="meter-card">
            <div className="meter-card-header">
              <h4 className="meter-card-title">
                📷 {t('meterdetail.latest_reading_evidence_photo')}
              </h4>
            </div>

            <div className="meter-evidence-container">
              {meter.lastReadingImageUrl ? (
                <div className="meter-evidence-wrapper">
                  <img
                    src={meter.lastReadingImageUrl}
                    alt={t('meterdetail.latest_meter_reading_evidence')}
                    className="meter-evidence-img"
                    onError={(event) => { event.currentTarget.hidden = true; }}
                  />
                </div>
              ) : (
                <div className="meter-empty-evidence">
                  <div className="meter-empty-icon">🖼️</div>
                  <p style={{ margin: 0, fontWeight: '500' }}>No evidence photo attached</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.7 }}>
                    The latest reading did not include a visual photo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
