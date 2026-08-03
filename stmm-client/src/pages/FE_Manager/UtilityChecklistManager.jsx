import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Droplets,
  MinusCircle,
  Store,
  Zap
} from 'lucide-react';

const PAGE_SIZE = 5;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`
});

export default function UtilityChecklistManager({ taskId, baseUrl }) {
  const { t } = useTranslation();
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchChecklist = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${baseUrl}/api/manager/tasks/${taskId}/stalls`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        let problem = null;
        try { problem = await response.json(); } catch { problem = null; }
        throw new Error(problem?.detail || problem?.title || t('utilitychecklist.failed_to_load_the'));
      }
      const payload = await response.json();
      setStalls(Array.isArray(payload) ? payload : []);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, taskId, t]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  const completed = stalls.filter((stall) => stall.hasReadingThisMonth).length;
  const pending = stalls.length - completed;
  const filteredStalls = useMemo(() => {
    if (filter === 'recorded') return stalls.filter((stall) => stall.hasReadingThisMonth);
    if (filter === 'pending') return stalls.filter((stall) => !stall.hasReadingThisMonth);
    return stalls;
  }, [filter, stalls]);

  const totalPages = Math.max(1, Math.ceil(filteredStalls.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleStalls = filteredStalls.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const changeFilter = (value) => {
    setFilter(value);
    setPage(1);
  };

  const renderMeterState = (hasMeter, hasReading, type) => {
    const Icon = type === 'electricity' ? Zap : Droplets;
    if (!hasMeter) {
      return (
        <span className="manager-meter-state is-unavailable">
          <MinusCircle size={14} aria-hidden="true" />
          {t('utilitychecklist.no_meter')}
        </span>
      );
    }
    return (
      <span className={`manager-meter-state ${hasReading ? 'is-recorded' : 'is-pending'}`}>
        <Icon size={14} aria-hidden="true" />
        {hasReading ? t('utilitychecklist.recorded') : t('utilitychecklist.not_recorded')}
      </span>
    );
  };

  return (
    <section className="spec-card manager-utility-card">
      <div className="manager-utility-heading">
        <div>
          <h3 className="spec-title">{t('utilitychecklist.utility_meter_checklist')}</h3>
          <p>
            {t('utilitychecklist.progress_summary', {
              completed,
              total: stalls.length,
              pending
            })}
          </p>
        </div>
        <strong>{stalls.length ? Math.round((completed / stalls.length) * 100) : 0}%</strong>
      </div>

      <div className="manager-utility-tabs" role="tablist" aria-label={t('utilitychecklist.filter_by_reading_status')}>
        {[
          ['all', t('utilitychecklist.all_count', { count: stalls.length })],
          ['pending', t('utilitychecklist.pending_count', { count: pending })],
          ['recorded', t('utilitychecklist.recorded_count', { count: completed })]
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            className={filter === value ? 'is-active' : ''}
            onClick={() => changeFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="manager-utility-state">{t('utilitychecklist.loading_stalls')}</div>
      ) : error ? (
        <div className="manager-utility-state manager-utility-state-error">
          <span>{error}</span>
          <button type="button" onClick={fetchChecklist}>{t('utilitychecklist.retry')}</button>
        </div>
      ) : filteredStalls.length === 0 ? (
        <div className="manager-utility-state">
          {filter === 'all'
            ? t('utilitychecklist.no_stalls_were_found')
            : t('utilitychecklist.no_stalls_match_filter')}
        </div>
      ) : (
        <>
          <div className="manager-utility-table-wrap">
            <table className="manager-utility-table">
              <thead>
                <tr>
                  <th>{t('utilitychecklist.stall')}</th>
                  <th>{t('utilitychecklist.electricity')}</th>
                  <th>{t('utilitychecklist.water')}</th>
                  <th>{t('utilitychecklist.result')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleStalls.map((stall) => (
                  <tr key={stall.stallId}>
                    <td>
                      <span className="manager-utility-stall">
                        <Store size={15} aria-hidden="true" />
                        {stall.stallCode}
                      </span>
                    </td>
                    <td>{renderMeterState(stall.hasElectricityMeter, stall.hasElectricityReadingThisMonth, 'electricity')}</td>
                    <td>{renderMeterState(stall.hasWaterMeter, stall.hasWaterReadingThisMonth, 'water')}</td>
                    <td>
                      <span className={`manager-utility-result ${stall.hasReadingThisMonth ? 'is-complete' : 'is-pending'}`}>
                        {stall.hasReadingThisMonth ? <CheckCircle2 size={14} aria-hidden="true" /> : null}
                        {stall.hasReadingThisMonth
                          ? t('utilitychecklist.complete')
                          : t('utilitychecklist.incomplete')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="manager-utility-pagination">
            <span>
              {t('utilitychecklist.showing_range', {
                from: (safePage - 1) * PAGE_SIZE + 1,
                to: Math.min(safePage * PAGE_SIZE, filteredStalls.length),
                total: filteredStalls.length
              })}
            </span>
            <div>
              <button
                type="button"
                aria-label={t('utilitychecklist.previous_page')}
                disabled={safePage === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft size={15} aria-hidden="true" />
              </button>
              <strong>{t('utilitychecklist.page_of', { page: safePage, total: totalPages })}</strong>
              <button
                type="button"
                aria-label={t('utilitychecklist.next_page')}
                disabled={safePage === totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                <ChevronRight size={15} aria-hidden="true" />
              </button>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}
