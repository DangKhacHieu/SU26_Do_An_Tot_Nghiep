import React, { useState, useEffect } from 'react';
import CreateViolationModal from './CreateViolationModal';
import './StallList.css';

export default function StallList({ baseUrl, userId, onShowNotification, onViewMeterHistory, onViewInvoices }) {
  const [stalls, setStalls] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(6); // 6 cards per page looks great on a grid
  const [filterType, setFilterType] = useState('All'); // 'All' | 'HasTask' | 'HasUnpaidInvoice'
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Modal State (Only CreateViolationModal remains)
  const [activeModal, setActiveModal] = useState(null); // null | 'violation'
  const [activeStallId, setActiveStallId] = useState(null);
  const [activeStallCode, setActiveStallCode] = useState('');

  const fetchStalls = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${baseUrl}/api/staff/stall-tasks?userId=${userId}&pageNumber=${pageNumber}&pageSize=${pageSize}`;
      if (filterType !== 'All') {
        url += `&filter=${filterType}`;
      }
      if (appliedSearch.trim() !== '') {
        url += `&search=${encodeURIComponent(appliedSearch.trim())}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load stalls: ${response.statusText}`);
      }
      const data = await response.json();
      setStalls(data.items || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching stalls checklist:", err);
      setError(err.message);
      setStalls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStalls();
  }, [userId, pageNumber, filterType, appliedSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPageNumber(1);
    setAppliedSearch(searchQuery);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setFilterType('All');
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
    fetchStalls(); // Reload list to update status badges
  };

  // Render a clean badge/tag based on task types
  const getTaskIcon = (type) => {
    switch (type) {
      case 'MeterReading': return '⚡';
      case 'CashCollection': return '💰';
      case 'Repair': return '🔧';
      case 'Maintenance': return '🧹';
      default: return '📋';
    }
  };

  const getTaskLabel = (type) => {
    switch (type) {
      case 'MeterReading': return 'Meter Reading';
      case 'CashCollection': return 'Cash Collection';
      case 'Repair': return 'Repair';
      case 'Maintenance': return 'Maintenance';
      default: return type;
    }
  };

  return (
    <div className="stall-list-page">


      {/* Toolbar: Search + Filters */}
      <div className="toolbar">
        <div className="toolbar-left">
          <form onSubmit={handleSearchSubmit} className="search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search by stall code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="search-clear" onClick={() => { setSearchQuery(''); setAppliedSearch(''); }} title="Clear">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </button>
            )}
          </form>

          <div className="filter-tabs">
            <button 
              className={`tab-btn ${filterType === 'All' ? 'active' : ''}`}
              onClick={() => { setFilterType('All'); setPageNumber(1); }}
            >
              All
            </button>
            <button 
              className={`tab-btn ${filterType === 'HasTask' ? 'active' : ''}`}
              onClick={() => { setFilterType('HasTask'); setPageNumber(1); }}
            >
              📋 Has Tasks
            </button>
            <button 
              className={`tab-btn ${filterType === 'HasUnpaidInvoice' ? 'active' : ''}`}
              onClick={() => { setFilterType('HasUnpaidInvoice'); setPageNumber(1); }}
            >
              💰 Unpaid Debt
            </button>
          </div>

          {(searchQuery || filterType !== 'All') && (
            <button type="button" className="btn-filter-clear" onClick={handleResetFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="loading-state">Loading stalls...</div>
      ) : error ? (
        <div className="error-state">
          <p className="error-message">Error: {error}</p>
          <button className="btn-secondary" onClick={fetchStalls}>Retry</button>
        </div>
      ) : stalls.length === 0 ? (
        <div className="empty-state">
          <p>No stalls match the selected filters.</p>
        </div>
      ) : (
        <>
          <div className="stalls-grid">
            {stalls.map((stall) => (
              <div key={stall.stallId} className="stall-card">
                <div className="stall-card-header">
                  <div className="stall-code-container">
                    <span className="stall-icon">🏪</span>
                    <span className="stall-code">{stall.stallCode}</span>
                  </div>
                  <span className={`stall-status-badge ${stall.stallStatus.toLowerCase()}`}>
                    {stall.stallStatus === 'Rented' ? 'Rented' : stall.stallStatus}
                  </span>
                </div>

                <div className="stall-card-body">
                  <div className="info-row">
                    <span className="info-label">Category:</span>
                    <span className="info-value">{stall.stallCategory || 'Uncategorized'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Owner:</span>
                    <span className="info-value font-semibold">{stall.vendorName || 'N/A'}</span>
                  </div>
                  {stall.vendorPhone && (
                    <div className="info-row">
                      <span className="info-label">Phone:</span>
                      <span className="info-value">{stall.vendorPhone}</span>
                    </div>
                  )}

                  <hr className="card-divider" />

                  {/* Task Tags */}
                  <div className="task-tags-container">
                    <span className="tags-title">Checklist Tasks:</span>
                    {stall.taskTypes.length === 0 ? (
                      <span className="no-tasks-tag">✅ Completed</span>
                    ) : (
                      <div className="tags-list">
                        {stall.taskTypes.map((type, idx) => (
                          <span key={idx} className={`task-type-tag ${type.toLowerCase()}`}>
                            {getTaskIcon(type)} {getTaskLabel(type)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Debt Summary */}
                  {stall.hasUnpaidInvoice && (
                    <div className="debt-summary-box">
                      <span>Unpaid invoice(s): <strong>{stall.unpaidInvoiceCount} month(s)</strong></span>
                      <span className="debt-total">{stall.unpaidTotalAmount.toLocaleString('vi-VN')} VND</span>
                    </div>
                  )}
                </div>

                <div className="stall-card-actions">
                  <button 
                    className="btn-card-action violation-btn" 
                    onClick={() => openModal('violation', stall.stallId, stall.stallCode)}
                    title="Report violation for this stall"
                  >
                    ⚠️ Violation
                  </button>

                  {stall.stallStatus === 'Rented' && (
                    <button 
                      className="btn-card-action meter-btn" 
                      onClick={() => onViewMeterHistory(stall.stallId)}
                      title="View meter reading history"
                    >
                      ⚡ Meter History
                    </button>
                  )}

                  {stall.hasUnpaidInvoice && (
                    <button 
                      className="btn-card-action cash-btn" 
                      onClick={() => onViewInvoices(stall.stallId, stall.stallCode)}
                      title="View unpaid invoices"
                    >
                      📄 View Invoices
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="pagination-wrapper">
            <span className="pagination-info">
              Showing {stalls.length} of {totalCount} stalls
            </span>
            <div className="pagination-buttons">
              <button 
                className="btn-page" 
                onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
                disabled={pageNumber === 1}
              >
                Prev
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`btn-page ${pageNumber === p ? 'active' : ''}`}
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
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modals Rendering */}
      {activeModal === 'violation' && (
        <CreateViolationModal
          userId={userId}
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
