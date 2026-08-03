import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import './MarketApprovalListAdminSystem.css';
import { getAllMarkets, changeMarketStatus } from '../../services/marketApi';
import MarketMapViewer from '../FE_Manager/MarketArea/components/MarketMapViewer';

/* ── Icons ── */
const IconCheck   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconX       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconEye     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconXCircle = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const IconEmpty   = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconWarning = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

export default function MarketApprovalListAdminSystem({ navigate, addToast }) {
  const { t } = useTranslation();

  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingMarketId, setViewingMarketId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [modalType, setModalType] = useState(null); // 'approve' | 'reject'
  const [targetMarket, setTargetMarket] = useState(null);

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const data = await getAllMarkets();
      // Sort newest first by createdAt or marketId
      const sortedData = (data || []).sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return (b.marketId || 0) - (a.marketId || 0);
      });
      setMarkets(sortedData);
    } catch (error) {
      console.error("Failed to load markets:", error);
      addToast('Không thể tải danh sách chợ chờ duyệt.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveConfirm = async () => {
    if (!targetMarket) return;
    setActionLoading(true);
    try {
      await changeMarketStatus(targetMarket.marketId, 'Active');
      addToast(modalType === 'reactivate' ? t('marketapprovallistadminsystem.reopening_market_operations_successfully') : t('marketapprovallistadminsystem.market_approval_successful'), 'success');
      closeModal();
      fetchMarkets();
    } catch (error) {
      addToast('Lỗi khi phê duyệt chợ.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!targetMarket) return;
    setActionLoading(true);
    try {
      await changeMarketStatus(targetMarket.marketId, 'Rejected');
      addToast('Đã từ chối yêu cầu tạo chợ.', 'success');
      closeModal();
      fetchMarkets();
    } catch (error) {
      addToast('Lỗi khi từ chối chợ.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInactiveConfirm = async () => {
    if (!targetMarket) return;
    setActionLoading(true);
    try {
      await changeMarketStatus(targetMarket.marketId, 'Inactive');
      addToast('Đã ngừng hoạt động chợ.', 'success');
      closeModal();
      fetchMarkets();
    } catch (error) {
      addToast('Lỗi khi ngừng hoạt động chợ.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (type, market) => {
    setTargetMarket(market);
    setModalType(type);
  };

  const closeModal = () => {
    setModalType(null);
    setTargetMarket(null);
  };

  // Compute stats for cards
  const stats = {
    total: markets.length,
    pending: markets.filter(m => m.status === 'Pending').length,
    active: markets.filter(m => m.status === 'Active').length,
    rejected: markets.filter(m => m.status === 'Rejected' || m.status === 'Inactive').length,
  };

  // Filter & Search logic
  const filteredMarkets = markets.filter(m => {
    const matchesSearch = 
      (m.name || m.marketName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.address || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === '' ? true : m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
  };

  const hasFilters = searchQuery !== '' || statusFilter !== '';

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Whenever filters change, reset page to 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFilteredMarkets = filteredMarkets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMarkets.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (viewingMarketId) {
    const activeMarket = markets.find(m => m.marketId === viewingMarketId);
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 80px)' }}>
        <div className="map-preview-panel">
          <div className="map-preview-header">
            <h3 className="map-preview-title">Sơ đồ mặt bằng: {activeMarket?.name || activeMarket?.marketName || t('marketapprovallistadminsystem.market')}</h3>
            <button className="btn-back-secondary" onClick={() => setViewingMarketId(null)}>
              {t('marketapprovallistadminsystem.back_to_list')}</button>
          </div>
          <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', minHeight: 600 }}>
            <MarketMapViewer marketId={viewingMarketId} onBack={() => setViewingMarketId(null)} hideBackBtn={true} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Stat Summary Cards Grid (Dashboard style) ── */}
      <div className="stats-grid">
        {/* Card Total */}
        <div className="stat-card" style={{ '--accent-color': '#8b5cf6', '--icon-bg': '#f3e8ff' }}>
          <div className="stat-header">
            <span className="stat-title">{t('marketapprovallistadminsystem.total_number_of_requests')}</span>
            <div className="stat-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
          </div>
          <span className="stat-value">{loading ? '—' : stats.total}</span>
        </div>

        {/* Card Pending */}
        <div className="stat-card" style={{ '--accent-color': '#d97706', '--icon-bg': '#fef9c3' }}>
          <div className="stat-header">
            <span className="stat-title">{t('marketapprovallistadminsystem.wait_for_approval')}</span>
            <div className="stat-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
          <span className="stat-value">{loading ? '—' : stats.pending}</span>
        </div>

        {/* Card Active */}
        <div className="stat-card" style={{ '--accent-color': '#10b981', '--icon-bg': '#dcfce7' }}>
          <div className="stat-header">
            <span className="stat-title">{t('marketapprovallistadminsystem.approved')}</span>
            <div className="stat-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
          </div>
          <span className="stat-value">{loading ? '—' : stats.active}</span>
        </div>

        {/* Card Rejected */}
        <div className="stat-card" style={{ '--accent-color': '#dc2626', '--icon-bg': '#fee2e2' }}>
          <div className="stat-header">
            <span className="stat-title">{t('marketapprovallistadminsystem.rejectedlocked')}</span>
            <div className="stat-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
          </div>
          <span className="stat-value">{loading ? '—' : stats.rejected}</span>
        </div>
      </div>

      {/* ── Toolbar Search & Filters ── */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-wrap">
            <IconSearch />
            <input
              type="text"
              className="search-input"
              placeholder={t('marketapprovallistadminsystem.search_markets_by_name')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')} title={t('marketapprovallistadminsystem.erase')}>
                <IconXCircle />
              </button>
            )}
          </div>

          <select 
            className="filter-select" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t('marketapprovallistadminsystem.all_status')}</option>
            <option value="Pending">{t('marketapprovallistadminsystem.wait_for_approval')}</option>
            <option value="Active">{t('marketapprovallistadminsystem.work')}</option>
            <option value="Rejected">{t('marketapprovallistadminsystem.refused')}</option>
            <option value="Inactive">{t('marketapprovallistadminsystem.shut_down')}</option>
          </select>

          {hasFilters && (
            <button className="btn-filter-clear" onClick={clearFilters}>
              {t('marketapprovallistadminsystem.clear_filter')}</button>
          )}
        </div>
      </div>

      {/* ── Table List Card ── */}
      <div className="table-card">
        <div className="table-card-header">
          <span className="table-card-title">{t('marketapprovallistadminsystem.list_of_market_floor')}</span>
          {!loading && (
            <span className="table-count-badge badge-admin">{filteredMarkets.length} kết quả</span>
          )}
        </div>

        {loading ? (
          <div className="state-empty">
            <div className="spinner" />
            <span className="state-empty-text">{t('marketapprovallistadminsystem.loading_market_map_data')}</span>
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="state-empty">
            <IconEmpty />
            <span className="state-empty-text">
              {hasFilters ? t('marketapprovallistadminsystem.no_results_were_found') : t('marketapprovallistadminsystem.there_are_no_current')}
            </span>
            {hasFilters && (
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={clearFilters}>
                {t('marketapprovallistadminsystem.clear_filter')}</button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="user-table">
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: 'center' }}>#</th>
                  <th>{t('marketapprovallistadminsystem.market_name')}</th>
                  <th>{t('marketapprovallistadminsystem.address')}</th>
                  <th>{t('marketapprovallistadminsystem.size_m')}</th>
                  <th>{t('marketapprovallistadminsystem.area_number')}</th>
                  <th>{t('marketapprovallistadminsystem.total_number_of_stalls')}</th>
                  <th>{t('marketapprovallistadminsystem.status')}</th>
                  <th style={{ width: 140, textAlign: 'center' }}>{t('marketapprovallistadminsystem.operation')}</th>
                </tr>
              </thead>
              <tbody>
                {currentFilteredMarkets.map((m, idx) => (
                  <tr key={m.marketId}>
                    <td className="row-no">{indexOfFirstItem + idx + 1}</td>
                    <td>
                      <div className="user-identity">
                        <div className="user-avatar-cell" style={{ background: '#8b5cf6' }}>
                          {(m.name || m.marketName || 'M').charAt(0).toUpperCase()}
                        </div>
                        <div className="name-col">
                          <span className="name-primary">{m.name || m.marketName}</span>
                        </div>
                      </div>
                    </td>
                    <td>{m.address || '—'}</td>
                    <td><span className="mono">{m.size || '—'}</span></td>
                    <td style={{ textAlign: 'center' }}><span className="mono">{m.areasCount || 0}</span></td>
                    <td style={{ textAlign: 'center' }}><span className="mono">{m.stallsCount || 0}</span></td>
                    <td>
                      <span className={`badge-status ${m.status?.toLowerCase() || 'pending'}`}>
                        <span className="badge-dot" />
                        {m.status === 'Pending' ? t('marketapprovallistadminsystem.wait_for_approval') : 
                         m.status === 'Active' ? t('marketapprovallistadminsystem.work') : 
                         m.status === 'Rejected' ? t('marketapprovallistadminsystem.refused') : 
                         m.status === 'Inactive' ? t('marketapprovallistadminsystem.shut_down') : m.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell" style={{ justifyContent: 'center' }}>
                        <button 
                          className="btn-icon view view-map-btn" 
                          title={t('marketapprovallistadminsystem.see_detailed_diagram')} 
                          onClick={() => setViewingMarketId(m.marketId)}
                          disabled={actionLoading}
                        >
                          <IconEye />
                        </button>
                        
                        {m.status === 'Pending' && (
                          <>
                            <button 
                              className="btn-icon unlock approve-btn" 
                              title={t('marketapprovallistadminsystem.approve')}
                              onClick={() => openModal('approve', m)}
                              disabled={actionLoading}
                            >
                              <IconCheck />
                            </button>
                            <button 
                              className="btn-icon lock reject-btn" 
                              title={t('marketapprovallistadminsystem.refuse')}
                              onClick={() => openModal('reject', m)}
                              disabled={actionLoading}
                            >
                              <IconX />
                            </button>
                          </>
                        )}
                        {m.status === 'Active' && (
                          <button 
                            className="btn-icon lock reject-btn" 
                            title={t('marketapprovallistadminsystem.stop_working')}
                            onClick={() => openModal('inactive', m)}
                            disabled={actionLoading}
                          >
                            <IconX />
                          </button>
                        )}
                        {m.status === 'Inactive' && (
                          <button 
                            className="btn-icon unlock approve-btn" 
                            title={t('marketapprovallistadminsystem.reopen_operations')}
                            onClick={() => openModal('reactivate', m)}
                            disabled={actionLoading}
                          >
                            <IconCheck />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && filteredMarkets.length > 0 && totalPages > 0 && (
          <div className="pagination">
            <button 
              className="page-btn" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              &lt;
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            
            <button 
              className="page-btn" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* ── Modern Confirmation Overlay Modals ── */}
      {modalType && targetMarket && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{
                modalType === 'approve' ? t('marketapprovallistadminsystem.approve_the_market_plan') : 
                modalType === 'reject' ? t('marketapprovallistadminsystem.reject_the_market_plan') :
                modalType === 'inactive' ? t('marketapprovallistadminsystem.stop_operating_the_market') :
                t('marketapprovallistadminsystem.reopen_market_operations')
              }</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className={`modal-icon-wrap ${modalType === 'approve' || modalType === 'reactivate' ? 'success' : 'danger'}`}>
                {modalType === 'approve' || modalType === 'reactivate' ? <IconCheck /> : <IconX />}
              </div>

              <p className="modal-desc">
                {modalType === 'approve' 
                  ? t('marketapprovallistadminsystem.are_you_sure_you')
                  : modalType === 'reject'
                  ? t('marketapprovallistadminsystem.are_you_sure_you')
                  : modalType === 'inactive'
                  ? t('marketapprovallistadminsystem.bn_c_chc_chn')
                  : t('marketapprovallistadminsystem.are_you_sure_you')}
              </p>

              {/* Market Summary Card inside Modal */}
              <div className="modal-user-card">
                <div className="modal-user-avatar" style={{ background: '#8b5cf6' }}>
                  {(targetMarket.name || targetMarket.marketName || 'M').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="modal-user-name">{targetMarket.name || targetMarket.marketName}</h4>
                  <p className="modal-user-meta">{targetMarket.address || t('marketapprovallistadminsystem.no_address_available')}</p>
                </div>
              </div>

              {/* Detail Info Grid inside Modal */}
              <div className="modal-market-info-grid">
                <div className="modal-market-info-item">
                  <label>{t('marketapprovallistadminsystem.size')}</label>
                  <span>{targetMarket.size || '—'} m²</span>
                </div>
                <div className="modal-market-info-item">
                  <label>{t('marketapprovallistadminsystem.area')}</label>
                  <span>{targetMarket.areasCount || 0} khu vực</span>
                </div>
                <div className="modal-market-info-item">
                  <label>{t('marketapprovallistadminsystem.number_of_stalls')}</label>
                  <span>{targetMarket.stallsCount || 0} sạp</span>
                </div>
                <div className="modal-market-info-item">
                  <label>{t('marketapprovallistadminsystem.status')}</label>
                  <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{t('marketapprovallistadminsystem.wait_for_approval')}</span>
                </div>
              </div>

              {/* Warning Alert Box */}
              {modalType === 'reject' && (
                <div className="modal-rule-warn danger">
                  <IconWarning /> {t('marketapprovallistadminsystem.rejecting_will_change_the')}</div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn-secondary" onClick={closeModal} disabled={actionLoading}>{t('marketapprovallistadminsystem.cancel')}</button>
              <button 
                className={modalType === 'approve' || modalType === 'reactivate' ? 'btn-success' : 'btn-danger'} 
                onClick={
                  modalType === 'approve' || modalType === 'reactivate' ? handleApproveConfirm : 
                  modalType === 'reject' ? handleRejectConfirm : 
                  handleInactiveConfirm
                }
                disabled={actionLoading}
              >
                {actionLoading ? t('marketapprovallistadminsystem.processing') : t('marketapprovallistadminsystem.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
