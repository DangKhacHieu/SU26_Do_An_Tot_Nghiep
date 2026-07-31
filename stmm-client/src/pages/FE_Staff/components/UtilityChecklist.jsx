import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Gauge,
  MinusCircle,
  Store,
  Zap
} from 'lucide-react';
import { getAuthHeaders } from '../../../utils/authHeaders';
import { TASK_STATUS } from '../../../constants/taskEnums';
import RecordMeterReadingModal from '../RecordMeterReadingModal';

const PAGE_SIZE = 5;

export default function UtilityChecklist({
  taskId,
  baseUrl,
  taskStatus,
  onShowNotification,
  onProgressChange
}) {
  const { t } = useTranslation();
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStall, setSelectedStall] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ completed: 0, total: 0 });

  const isReadOnly = [TASK_STATUS.COMPLETED, TASK_STATUS.CANCELLED].includes(taskStatus);

  const fetchStalls = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/api/staff/tasks/${taskId}/stalls`, {
        headers: getAuthHeaders()
      });
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
      onProgressChange?.(completed, items.length);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [baseUrl, onProgressChange, taskId, t]);

  useEffect(() => {
    fetchStalls();
  }, [fetchStalls]);

  const filteredStalls = useMemo(() => {
    if (filter === 'recorded') return stalls.filter((stall) => stall.hasReadingThisMonth);
    if (filter === 'pending') return stalls.filter((stall) => !stall.hasReadingThisMonth);
    return stalls;
  }, [filter, stalls]);

  const totalPages = Math.max(1, Math.ceil(filteredStalls.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleStalls = filteredStalls.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pendingCount = stats.total - stats.completed;

  const changeFilter = (nextFilter) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const formatStallStatus = (status) => {
    const normalized = status?.toLowerCase();
    if (normalized === 'rented') return t('utilitychecklist.rented');
    if (normalized === 'available') return t('utilitychecklist.available');
    if (normalized === 'maintenance') return t('utilitychecklist.maintenance');
    return status || t('utilitychecklist.unknown');
  };

  const renderMeterState = (hasMeter, hasReading, icon) => {
    if (!hasMeter) {
      return (
        <span className="meter-state meter-state--unavailable">
          <MinusCircle size={15} aria-hidden="true" />
          {t('utilitychecklist.no_meter')}
        </span>
      );
    }

    return hasReading ? (
      <span className="meter-state meter-state--recorded">
        {icon}
        {t('utilitychecklist.recorded')}
      </span>
    ) : (
      <span className="meter-state meter-state--pending">
        {icon}
        {t('utilitychecklist.not_recorded')}
      </span>
    );
  };

  const renderLoadingRows = () => (
    Array.from({ length: 3 }, (_, index) => (
      <tr key={index} className="utility-skeleton-row" aria-hidden="true">
        <td><span className="utility-skeleton utility-skeleton--short" /></td>
        <td><span className="utility-skeleton" /></td>
        <td><span className="utility-skeleton" /></td>
        <td><span className="utility-skeleton utility-skeleton--short" /></td>
        <td><span className="utility-skeleton utility-skeleton--short" /></td>
      </tr>
    ))
  );

  return (
    <section className="utility-checklist-panel">
      <header className="utility-checklist-header">
        <div>
          <h3 className="card-section-title">
            <Gauge size={18} aria-hidden="true" />
            {t('utilitychecklist.utility_meter_checklist')}
          </h3>
          <p className="checklist-stat-text">
            {t('utilitychecklist.progress_summary', {
              completed: stats.completed,
              total: stats.total,
              pending: pendingCount
            })}
          </p>
        </div>
        <div className="utility-progress-number" aria-label={t('utilitychecklist.completion_rate')}>
          <strong>{stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%</strong>
          <span>{t('utilitychecklist.completed')}</span>
        </div>
      </header>

      <div className="utility-filter-tabs" role="tablist" aria-label={t('utilitychecklist.filter_by_reading_status')}>
        {[
          ['all', t('utilitychecklist.all_count', { count: stats.total })],
          ['pending', t('utilitychecklist.pending_count', { count: pendingCount })],
          ['recorded', t('utilitychecklist.recorded_count', { count: stats.completed })]
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            className={`utility-filter-tab ${filter === value ? 'is-active' : ''}`}
            onClick={() => changeFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="utility-inline-state utility-inline-state--error">
          <span>{error}</span>
          <button type="button" className="btn-secondary" onClick={() => fetchStalls()}>
            {t('utilitychecklist.retry')}
          </button>
        </div>
      ) : (
        <div className="utility-table-wrap">
          <table className="checklist-table">
            <thead>
              <tr>
                <th>{t('utilitychecklist.stall')}</th>
                <th><Zap size={14} aria-hidden="true" /> {t('utilitychecklist.electricity')}</th>
                <th><Droplets size={14} aria-hidden="true" /> {t('utilitychecklist.water')}</th>
                <th>{t('utilitychecklist.result')}</th>
                <th>{t('utilitychecklist.action')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? renderLoadingRows() : null}
              {!loading && visibleStalls.map((stall) => {
                const missingMeter = !stall.hasElectricityMeter || !stall.hasWaterMeter;
                return (
                  <tr key={stall.stallId}>
                    <td>
                      <div className="utility-stall-cell">
                        <Store size={16} aria-hidden="true" />
                        <div>
                          <strong>{stall.stallCode}</strong>
                          <span>{formatStallStatus(stall.stallStatus)}</span>
                        </div>
                      </div>
                    </td>
                    <td>{renderMeterState(stall.hasElectricityMeter, stall.hasElectricityReadingThisMonth, <Zap size={15} aria-hidden="true" />)}</td>
                    <td>{renderMeterState(stall.hasWaterMeter, stall.hasWaterReadingThisMonth, <Droplets size={15} aria-hidden="true" />)}</td>
                    <td>
                      {stall.hasReadingThisMonth ? (
                        <span className="utility-result utility-result--complete">
                          <CheckCircle2 size={15} aria-hidden="true" />
                          {t('utilitychecklist.complete')}
                        </span>
                      ) : (
                        <span className={`utility-result ${missingMeter ? 'utility-result--warning' : 'utility-result--pending'}`}>
                          {missingMeter ? t('utilitychecklist.meter_setup_required') : t('utilitychecklist.incomplete')}
                        </span>
                      )}
                    </td>
                    <td>
                      {!stall.hasReadingThisMonth && !isReadOnly && !missingMeter ? (
                        <button
                          type="button"
                          className="utility-record-btn"
                          onClick={() => setSelectedStall(stall)}
                        >
                          {t('utilitychecklist.record')}
                        </button>
                      ) : (
                        <span className="utility-readonly-label">
                          {stall.hasReadingThisMonth
                            ? t('utilitychecklist.recorded')
                            : t('utilitychecklist.review_required')}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loading && filteredStalls.length === 0 ? (
            <div className="utility-inline-state">
              {filter === 'all'
                ? t('utilitychecklist.no_stalls_were_found')
                : t('utilitychecklist.no_stalls_match_filter')}
            </div>
          ) : null}
        </div>
      )}

      {!loading && !error && filteredStalls.length > 0 ? (
        <footer className="utility-pagination">
          <span>
            {t('utilitychecklist.showing_range', {
              from: (safePage - 1) * PAGE_SIZE + 1,
              to: Math.min(safePage * PAGE_SIZE, filteredStalls.length),
              total: filteredStalls.length
            })}
          </span>
          <div className="utility-pagination-actions">
            <button
              type="button"
              aria-label={t('utilitychecklist.previous_page')}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage === 1}
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <strong>{t('utilitychecklist.page_of', { page: safePage, total: totalPages })}</strong>
            <button
              type="button"
              aria-label={t('utilitychecklist.next_page')}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={safePage === totalPages}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </footer>
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
