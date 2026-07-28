import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import CreateViolationModal from './CreateViolationModal';
import readProblemDetail from '../../utils/readProblemDetail';
import './StallList.css';

export default function StallList({ baseUrl, onShowNotification, onViewMeterHistory, onViewInvoices }) {
  const { t } = useTranslation();

  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(6);
  const [filterType, setFilterType] = useState(t('stalllist.all'));
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
  }, [baseUrl]);

  useEffect(() => {
    fetchStalls();
  }, [fetchStalls]);

  const filteredStalls = useMemo(() => {
    const normalizedSearch = appliedSearch.trim().toLowerCase();

    return stalls.filter((stall) => {
      const matchesSearch = !normalizedSearch
        || String(stall.stallCode || '').toLowerCase().includes(normalizedSearch);
      const matchesFilter = filterType === t('stalllist.all')
        || (filterType === t('stalllist.hastask') && Number(stall.pendingTaskCount || 0) > 0)
        || (filterType === t('stalllist.hasunpaidinvoice') && Boolean(stall.hasUnpaidInvoice));

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
    setFilterType(t('stalllist.all'));
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
    onShowNotification(message, t('stalllist.success'));
    fetchStalls();
  };

  const getTaskIcon = (type) => {
    switch (type) {
      case 'UtilityReading': return t('stalllist.meter');
      case t('stalllist.repair'): return '🔧';
      case t('stalllist.maintenance'): return '🧹';
      default: return '📋';
    }
  };

  const getTaskLabel = (type) => {
    switch (type) {
      case 'UtilityReading': return t('stalllist.utility_reading');
      case t('stalllist.repair'): return t('stalllist.repair');
      case t('stalllist.maintenance'): return t('stalllist.maintenance');
      default: return type;
    }
  };

  return (
    <div className="stall-list-page">


      <div className="toolbar">
        <div className="toolbar-left">
          <form onSubmit={handleSearchSubmit} className="search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill={t('stalllist.none')} stroke={t('stalllist.currentcolor')} strokeWidth="2.5" strokeLinecap={t('stalllist.round')} strokeLinejoin={t('stalllist.round')}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              className="search-input"
              placeholder={t('stalllist.search_by_stall_code')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="search-clear" onClick={() => { setSearchQuery(''); setAppliedSearch(''); }} title={t('stalllist.clear')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={t('stalllist.none')} stroke={t('stalllist.currentcolor')} strokeWidth="2" strokeLinecap={t('stalllist.round')} strokeLinejoin={t('stalllist.round')}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </button>
            )}
          </form>

          <div className="filter-tabs">
            <button 
              className={`tab-btn ${filterType === t('stalllist.all') ? t('stalllist.active') : ''}`}
              onClick={() => { setFilterType(t('stalllist.all')); setPageNumber(1); }}
            >
              {t('stalllist.all')}</button>
            <button 
              className={`tab-btn ${filterType === t('stalllist.hastask') ? t('stalllist.active') : ''}`}
              onClick={() => { setFilterType(t('stalllist.hastask')); setPageNumber(1); }}
            >
              {t('stalllist.assigned_tasks')}</button>
            <button 
              className={`tab-btn ${filterType === t('stalllist.hasunpaidinvoice') ? 'active' : ''}`}
              onClick={() => { setFilterType(t('stalllist.hasunpaidinvoice')); setPageNumber(1); }}
            >
              {t('stalllist.unpaid_invoices')}</button>
          </div>

          {(searchQuery || filterType !== t('stalllist.all')) && (
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
                    {stall.stallStatus === t('stalllist.rented') ? t('stalllist.rented') : stall.stallStatus}
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
                      <span className="no-tasks-tag">✅ Completed</span>
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
                      <span>{t('stalllist.unpaid_invoices')}<strong>{stall.unpaidInvoiceCount} month(s)</strong></span>
                      <span className="debt-total">{stall.unpaidTotalAmount.toLocaleString('vi-VN')} VND</span>
                    </div>
                  )}
                </div>

                <div className="stall-card-actions">
                  <button 
                    className="btn-card-action violation-btn" 
                    onClick={() => openModal(t('stalllist.violation'), stall.stallId, stall.stallCode)}
                    title={t('stalllist.report_violation_for_this')}
                  >
                    ⚠️ Violation
                  </button>

                  {stall.stallStatus === t('stalllist.rented') && (
                    <button 
                      className="btn-card-action meter-btn" 
                      onClick={() => onViewMeterHistory(stall.stallId)}
                      title={t('stalllist.view_meter_reading_history')}
                    >
                      ⚡ Meter History
                    </button>
                  )}

                  {stall.hasUnpaidInvoice && (
                    <button 
                      className="btn-card-action cash-btn" 
                      onClick={() => onViewInvoices(stall.stallId, stall.stallCode)}
                      title={t('stalllist.view_unpaid_invoices')}
                    >
                      📄 View Invoices
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
                  className={`btn-page ${safePageNumber === p ? t('stalllist.active') : ''}`}
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

      {activeModal === t('stalllist.violation') && (
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
