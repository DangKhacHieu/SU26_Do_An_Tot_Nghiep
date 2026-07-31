import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import CreateViolationModal from './CreateViolationModal';
import readProblemDetail from '../../utils/readProblemDetail';
import './StallList.css';

const FILTER = Object.freeze({ ALL: 'all', HAS_TASK: 'hasTask', HAS_UNPAID_INVOICE: 'hasUnpaidInvoice' });
const STALL_STATUS = Object.freeze({ RENTED: 'Rented' });
const TASK_TYPE = Object.freeze({ REPAIR: 'Repair', MAINTENANCE: 'Maintenance', UTILITY_READING: 'UtilityReading' });

export default function StallList({ baseUrl, onShowNotification, onViewMeterHistory, onViewInvoices }) {
  const { t, i18n } = useTranslation();

  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(6);
  const [filterType, setFilterType] = useState(FILTER.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [activeModal, setActiveModal] = useState(null);
  const [activeStallId, setActiveStallId] = useState(null);
  const [activeStallCode, setActiveStallCode] = useState('');

  const fetchStalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/api/staff/stall-tasks`, { headers: getAuthHeaders() });
      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t('stalllist.unable_to_load_stalls')));
      }
      const data = await response.json();
      setStalls(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(t('stalllist.error_fetching_stalls_checklist'), err);
      setError(err.message);
      setStalls([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, t]);

  useEffect(() => {
    fetchStalls();
  }, [fetchStalls]);

  const filteredStalls = useMemo(() => {
    const normalizedSearch = appliedSearch.trim().toLowerCase();

    return stalls.filter((stall) => {
      const matchesSearch = !normalizedSearch
        || String(stall.stallCode || '').toLowerCase().includes(normalizedSearch);
      const matchesFilter = filterType === FILTER.ALL
        || (filterType === FILTER.HAS_TASK && Number(stall.pendingTaskCount || 0) > 0)
        || (filterType === FILTER.HAS_UNPAID_INVOICE && Boolean(stall.hasUnpaidInvoice));

      return matchesSearch && matchesFilter;
    });
  }, [appliedSearch, filterType, stalls]);

  const totalCount = filteredStalls.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePageNumber = Math.min(pageNumber, totalPages);
  const visibleStalls = useMemo(() => {
    const startIndex = (safePageNumber - 1) * pageSize;
    return filteredStalls.slice(startIndex, startIndex + pageSize);
  }, [filteredStalls, pageSize, safePageNumber]);

  useEffect(() => {
    if (pageNumber !== safePageNumber) setPageNumber(safePageNumber);
  }, [pageNumber, safePageNumber]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPageNumber(1);
    setAppliedSearch(searchQuery);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setFilterType(FILTER.ALL);
    setPageNumber(1);
  };

  const openModal = (modalType, stallId, stallCode) => {
    setActiveStallId(stallId);
    setActiveStallCode(stallCode);
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
    setActiveStallId(null);
    setActiveStallCode('');
  };

  const handleModalSuccess = (message) => {
    closeModal();
    onShowNotification(message, 'success');
    fetchStalls();
  };

  const getTaskIcon = (type) => {
    switch (type) {
      case 'UtilityReading': return '⚡';
      case TASK_TYPE.REPAIR: return '🔧';
      case TASK_TYPE.MAINTENANCE: return '🧹';
      default: return '📋';
    }
  };

  const getTaskLabel = (type) => {
    switch (type) {
      case 'UtilityReading': return t('stalllist.utility_reading');
      case TASK_TYPE.REPAIR: return t('stalllist.repair');
      case TASK_TYPE.MAINTENANCE: return t('stalllist.maintenance');
      default: return type;
    }
  };

  return (
    <div className="stall-list-page">


      <div className="toolbar">
        <div className="toolbar-left">
          <form onSubmit={handleSearchSubmit} className="search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              className="search-input"
              placeholder={t('stalllist.search_by_stall_code')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="search-clear" onClick={() => { setSearchQuery(''); setAppliedSearch(''); }} title={t('stalllist.clear')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </button>
            )}
          </form>

          <div className="filter-tabs">
            <button 
               className={`tab-btn ${filterType === FILTER.ALL ? 'active' : ''}`}
               onClick={() => { setFilterType(FILTER.ALL); setPageNumber(1); }}
            >
              {t('stalllist.all')}</button>
            <button 
               className={`tab-btn ${filterType === FILTER.HAS_TASK ? 'active' : ''}`}
               onClick={() => { setFilterType(FILTER.HAS_TASK); setPageNumber(1); }}
            >
              {t('stalllist.assigned_tasks')}</button>
            <button 
               className={`tab-btn ${filterType === FILTER.HAS_UNPAID_INVOICE ? 'active' : ''}`}
               onClick={() => { setFilterType(FILTER.HAS_UNPAID_INVOICE); setPageNumber(1); }}
            >
              {t('stalllist.unpaid_invoices')}</button>
          </div>

           {(searchQuery || filterType !== FILTER.ALL) && (
            <button type="button" className="btn-filter-clear" onClick={handleResetFilters}>
              {t('stalllist.clear_filters')}</button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">{t('stalllist.loading_stalls')}</div>
      ) : error ? (
        <div className="error-state">
          <p className="error-message">Error: {error}</p>
          <button className="btn-secondary" onClick={fetchStalls}>{t('stalllist.retry')}</button>
        </div>
      ) : visibleStalls.length === 0 ? (
        <div className="empty-state">
          <p>{t('stalllist.no_stalls_match_the')}</p>
        </div>
      ) : (
        <>
          <div className="stalls-grid">
            {visibleStalls.map((stall) => (
              <div key={stall.stallId} className="stall-card">
                <div className="stall-card-header">
                  <div className="stall-code-container">
                    <span className="stall-icon">🏪</span>
                    <span className="stall-code">{stall.stallCode}</span>
                  </div>
                  <span className={`stall-status-badge ${stall.stallStatus.toLowerCase()}`}>
                    {stall.stallStatus === STALL_STATUS.RENTED ? t('stalllist.rented') : stall.stallStatus}
                  </span>
                </div>

                <div className="stall-card-body">
                  <div className="info-row">
                    <span className="info-label">{t('stalllist.category')}</span>
                    <span className="info-value">{stall.stallCategory || t('stalllist.uncategorized')}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('stalllist.owner')}</span>
                    <span className="info-value font-semibold">{stall.vendorName || t('stalllist.na')}</span>
                  </div>
                  {stall.vendorPhone && (
                    <div className="info-row">
                      <span className="info-label">{t('stalllist.phone')}</span>
                      <span className="info-value">{stall.vendorPhone}</span>
                    </div>
                  )}

                  <hr className="card-divider" />

                  <div className="task-tags-container">
                    <span className="tags-title">{t('stalllist.checklist_tasks')}</span>
                    {(stall.taskTypes || []).length === 0 ? (
                      <span className="no-tasks-tag">✅ {t('stalllist.completed')}</span>
                    ) : (
                      <div className="tags-list">
                        {(stall.taskTypes || []).map((type) => (
                          <span key={type} className={`task-type-tag ${type.toLowerCase()}`}>
                            {getTaskIcon(type)} {getTaskLabel(type)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {stall.hasUnpaidInvoice && (
                    <div className="debt-summary-box">
                      <span>{t('stalllist.unpaid_invoices')}<strong>{t('stalllist.month_count', { count: stall.unpaidInvoiceCount })}</strong></span>
                      <span className="debt-total">{stall.unpaidTotalAmount.toLocaleString(i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US')} VND</span>
                    </div>
                  )}
                </div>

                <div className="stall-card-actions">
                  <button 
                    className="btn-card-action violation-btn" 
                    onClick={() => openModal('violation', stall.stallId, stall.stallCode)}
                    title={t('stalllist.report_violation_for_this')}
                  >
                    ⚠️ Violation
                  </button>

                  {stall.stallStatus === STALL_STATUS.RENTED && (() => {
                    const hasUtilityTask = (stall.taskTypes || []).includes(TASK_TYPE.UTILITY_READING);
                    return (
                      <button 
                        className="btn-card-action meter-btn" 
                        onClick={() => hasUtilityTask && onViewMeterHistory(stall.stallId)}
                        disabled={!hasUtilityTask}
                        title={hasUtilityTask 
                          ? t('stalllist.view_meter_reading_history') 
                          : (i18n.language?.startsWith('vi') 
                              ? 'Sạp này hiện không có nhiệm vụ đo điện nước' 
                              : 'No utility reading task assigned for this stall')}
                      >
                        ⚡ {t('stalllist.meter_history')}
                      </button>
                    );
                  })()}

                  {stall.hasUnpaidInvoice && (
                    <button 
                      className="btn-card-action cash-btn" 
                      onClick={() => onViewInvoices(stall.stallId, stall.stallCode)}
                      title={t('stalllist.view_unpaid_invoices')}
                    >
                      📄 {t('stalllist.view_invoices')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pagination-wrapper">
            <span className="pagination-info">
              Showing {visibleStalls.length} of {totalCount} stalls
            </span>
            <div className="pagination-buttons">
              <button 
                className="btn-page" 
                onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
                disabled={safePageNumber === 1}
              >
                {t('stalllist.prev')}</button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`btn-page ${safePageNumber === p ? 'active' : ''}`}
                  onClick={() => setPageNumber(p)}
                >
                  {p}
                </button>
              ))}

              <button 
                className="btn-page" 
                onClick={() => setPageNumber(p => Math.min(p + 1, totalPages))}
                disabled={safePageNumber === totalPages}
              >
                {t('stalllist.next')}</button>
            </div>
          </div>
        </>
      )}

      {activeModal === 'violation' && (
        <CreateViolationModal
          baseUrl={baseUrl}
          prefilledStallId={activeStallId}
          onClose={closeModal}
          onSuccess={(newViolation) => 
            handleModalSuccess(`Successfully reported violation ${newViolation.violationId} for stall ${activeStallCode}`)
          }
        />
      )}
    </div>
  );
}
