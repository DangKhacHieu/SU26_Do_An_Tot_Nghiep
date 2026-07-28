import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import readProblemDetail from '../../utils/readProblemDetail';
import './MeterReadingHistory.css';

export default function MeterReadingHistory({ stallId, baseUrl, onViewMeterDetail, onOpenRecordModal, onBack }) {
  const { t } = useTranslation();

  const [readings, setReadings] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [meterType, setMeterType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReadings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${baseUrl}/api/meter-readings?stallId=${stallId}&pageNumber=${pageNumber}&pageSize=${pageSize}`;
      if (meterType) {
        url += `&meterType=${meterType}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t('meterreadinghistory.unable_to_load_meter')));
      }
      const data = await response.json();
      setReadings(data.items || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message);
      setReadings([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, meterType, pageNumber, pageSize, stallId]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  const formatDate = (dateString) => {
    if (!dateString) return t('meterreadinghistory.na');
    return new Date(dateString).toLocaleDateString(t('meterreadinghistory.enus'), {
      year: t('meterreadinghistory.numeric'),
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="violation-list-container">
      <div className="toolbar">
        <div className="toolbar-left">
          <select
            value={meterType}
            onChange={(e) => { setMeterType(e.target.value); setPageNumber(1); }}
            className="filter-select"
          >
            <option value="">{t('meterreadinghistory.all_utilities')}</option>
            <option value={t('meterreadinghistory.electricity')}>{t('meterreadinghistory.electricity')}</option>
            <option value={t('meterreadinghistory.water')}>{t('meterreadinghistory.water')}</option>
          </select>

          <button className="btn-secondary" onClick={fetchReadings} disabled={loading}>
            {t('meterreadinghistory.refresh')}</button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary-outline" onClick={onBack}>
            &larr; Back
          </button>
          <button className="btn-primary" onClick={onOpenRecordModal}>
            + Record Reading
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">{t('meterreadinghistory.loading_history')}</div>
      ) : error ? (
        <div className="error-state">
          <p className="error-message">Error: {error}</p>
          <button className="btn-secondary" onClick={fetchReadings}>{t('meterreadinghistory.retry')}</button>
        </div>
      ) : readings.length === 0 ? (
        <div className="empty-state">
          <p>{t('meterreadinghistory.no_meter_readings_recorded')}</p>
        </div>
      ) : (
        <>
          <div className="table-card">
            <div className="table-card-header">
              <span className="table-card-title">{t('meterreadinghistory.meter_readings')}</span>
              <span className="table-count-badge">{totalCount} records</span>
            </div>
            <div className="table-responsive">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>{t('meterreadinghistory.serial_number')}</th>
                    <th>{t('meterreadinghistory.type')}</th>
                    <th>{t('meterreadinghistory.old_value')}</th>
                    <th>{t('meterreadinghistory.new_value')}</th>
                    <th>{t('meterreadinghistory.consumption')}</th>
                    <th>{t('meterreadinghistory.recorded_at')}</th>
                    <th>{t('meterreadinghistory.staff')}</th>
                    <th>{t('meterreadinghistory.evidence')}</th>
                    <th>{t('meterreadinghistory.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r) => (
                    <tr key={r.meterReadingId}>
                      <td>
                        <button 
                          className="btn-link" 
                          onClick={() => onViewMeterDetail(r.meterId)}
                          style={{ fontWeight: 'bold', padding: 0 }}
                        >
                          {r.meterSerialNumber}
                        </button>
                      </td>
                      <td>
                        <span className={`status-badge ${r.meterType?.toLowerCase() === t('meterreadinghistory.electricity') ? t('meterreadinghistory.approved') : t('meterreadinghistory.finalized')}`}>
                          {r.meterType === t('meterreadinghistory.electricity') ? '⚡ Electricity' : '💧 Water'}
                        </span>
                      </td>
                      <td>{r.oldValue}</td>
                      <td>{r.newValue}</td>
                      <td><strong>{r.consumption.toFixed(2)}</strong></td>
                      <td>{formatDate(r.recordedAt)}</td>
                      <td>{r.createdByName || `ID: ${r.createdByUserId}`}</td>
                      <td>
                        {r.imageUrl ? (
                          <a 
                            href={r.imageUrl} 
                            target={t('meterreadinghistory.blank')} 
                            rel={t('meterreadinghistory.noopener_noreferrer')}
                            className="btn-link"
                            style={{ color: '#0066cc' }}
                          >
                            {t('meterreadinghistory.view_image')}</a>
                        ) : (
                          <span style={{ color: '#888' }}>{t('meterreadinghistory.no_image')}</span>
                        )}
                      </td>
                      <td>
                        <button 
                          className="btn-link" 
                          onClick={() => onViewMeterDetail(r.meterId)}
                        >
                          {t('meterreadinghistory.meter_info')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pagination-wrapper">
            <span className="pagination-info">
              Showing {readings.length} entries of {totalCount} total
            </span>
            <div className="pagination-buttons">
              <button
                className="btn-page"
                onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
                disabled={pageNumber === 1}
              >
                {t('meterreadinghistory.prev')}</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`btn-page ${pageNumber === p ? t('meterreadinghistory.active') : ''}`}
                  onClick={() => setPageNumber(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="btn-page"
                onClick={() => setPageNumber(p => Math.min(p + 1, totalPages))}
                disabled={pageNumber === totalPages}
              >
                {t('meterreadinghistory.next')}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
