import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Gauge, Lightbulb, Store } from 'lucide-react';
import { getAuthHeaders } from '../../../utils/authHeaders';
import RecordMeterReadingModal from '../RecordMeterReadingModal';

export default function UtilityChecklist({ taskId, baseUrl, onShowNotification, onProgressChange }) {
  const { t } = useTranslation();

  const [expanded, setExpanded] = useState(false);
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStall, setSelectedStall] = useState(null);
  const [stats, setStats] = useState({ completed: 0, total: 0 });

  const fetchStalls = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/api/staff/tasks/${taskId}/stalls`, { headers: getAuthHeaders() });
      if (!response.ok) {
        let problem = null;
        try { problem = await response.json(); } catch { problem = null; }
        throw new Error(problem?.detail || problem?.title || t('utilitychecklist.failed_to_load_the'));
      }

      const payload = await response.json();
      const items = Array.isArray(payload) ? payload : [];
      const completed = items.filter((stall) => stall.hasReadingThisMonth).length;
      const nextStats = { completed, total: items.length };
      setStalls(items);
      setStats(nextStats);
      onProgressChange?.(nextStats.completed, nextStats.total);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [baseUrl, onProgressChange, taskId, t]);

  useEffect(() => {
    fetchStalls(true);
  }, [fetchStalls]);

  return (
    <section className="utility-checklist-panel">
      <div className="panel-header-with-action">
        <div className="checklist-summary-info">
          <h3 className="card-section-title"><Gauge size={18} aria-hidden="true" /> {t('utilitychecklist.utility_meter_checklist')}</h3>
          <p className="checklist-stat-text">{t('utilitychecklist.progress')}<strong>{stats.completed} / {stats.total}</strong> {t('utilitychecklist.stalls_recorded_this_month')}</p>
        </div>
        <button
          type="button"
          onClick={() => { const next = !expanded; setExpanded(next); if (next) fetchStalls(); }}
          className="btn-secondary toggle-checklist-btn"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? t('utilitychecklist.collapse') : t('utilitychecklist.view_stalls')}
        </button>
      </div>

      {expanded ? (
        <div className="checklist-expand-content">
          {loading ? <div className="loading-state-inline">{t('utilitychecklist.loading_stalls')}</div> : null}
          {!loading && error ? <div className="error-alert">{error}</div> : null}
          {!loading && !error && stalls.length === 0 ? <div className="empty-table-cell">{t('utilitychecklist.no_stalls_were_found')}</div> : null}
          {!loading && !error && stalls.length > 0 ? (
            <div className="stalls-grid-checklist">
              <table className="checklist-table">
                <thead><tr><th>{t('utilitychecklist.stall')}</th><th>{t('utilitychecklist.operation_status')}</th><th>{t('utilitychecklist.reading_status')}</th><th>{t('utilitychecklist.action')}</th></tr></thead>
                <tbody>
                  {stalls.map((stall) => (
                    <tr key={stall.stallId} className={stall.hasReadingThisMonth ? 'row-completed' : 'row-pending'}>
                      <td className="stall-code-cell"><Store size={15} aria-hidden="true" /> {stall.stallCode}</td>
                      <td><span className="status-badge badge-default">{stall.stallStatus}</span></td>
                      <td>{stall.hasReadingThisMonth ? <span className="reading-done-badge">{t('utilitychecklist.recorded')}</span> : <span className="reading-pending-badge">{t('utilitychecklist.pending')}</span>}</td>
                      <td>
                        {!stall.hasReadingThisMonth ? (
                          <button type="button" className="btn-primary-dark checklist-record-btn" onClick={() => setSelectedStall(stall)}>{t('utilitychecklist.record')}</button>
                        ) : <span className="checklist-complete-label">{t('utilitychecklist.complete')}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <div className="checklist-footer-note"><Lightbulb size={15} aria-hidden="true" /> {t('utilitychecklist.record_each_stall_here')}</div>
        </div>
      ) : null}

      {selectedStall ? (
        <RecordMeterReadingModal
          stallId={selectedStall.stallId}
          baseUrl={baseUrl}
          onClose={() => setSelectedStall(null)}
          onSuccess={async () => {
            setSelectedStall(null);
            await fetchStalls(true);
            onShowNotification?.(t('utilitychecklist.meter_reading_for_stall'), 'success');
          }}
        />
      ) : null}
    </section>
  );
}
