import React, { useState, useEffect } from 'react';
import './UserListAdminSystem.css'; // Reuse existing styles
import { getAllMarkets, changeMarketStatus } from '../../services/marketApi';
import MarketMapViewer from '../FE_Manager/MarketArea/components/MarketMapViewer';

/* ── Icons ── */
const IconCheck   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconX       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconEye     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEmpty   = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;

export default function MarketApprovalListAdminSystem({ navigate, addToast }) {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingMarketId, setViewingMarketId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const data = await getAllMarkets();
      setMarkets(data);
    } catch (error) {
      console.error("Failed to load markets:", error);
      addToast('Không thể tải danh sách chợ chờ duyệt.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (marketId) => {
    if (!window.confirm("Bạn có chắc chắn muốn phê duyệt chợ này?")) return;
    
    setActionLoading(true);
    try {
      await changeMarketStatus(marketId, 'Active');
      addToast('Phê duyệt chợ thành công!', 'success');
      fetchMarkets();
    } catch (error) {
      addToast('Lỗi khi phê duyệt chợ.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (marketId) => {
    if (!window.confirm("Bạn có chắc chắn muốn từ chối chợ này?")) return;
    
    setActionLoading(true);
    try {
      await changeMarketStatus(marketId, 'Rejected');
      addToast('Đã từ chối chợ.', 'success');
      fetchMarkets();
    } catch (error) {
      addToast('Lỗi khi từ chối chợ.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (viewingMarketId) {
    return (
      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 80px)' }}>
        <button 
          onClick={() => setViewingMarketId(null)}
          style={{ marginBottom: '16px', padding: '8px 16px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', width: 'fit-content' }}
        >
          &larr; Quay lại danh sách
        </button>
        <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', minHeight: 600 }}>
          <MarketMapViewer marketId={viewingMarketId} onBack={() => setViewingMarketId(null)} hideBackBtn={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="ul-container">
      <div className="ul-header">
        <div className="ul-title-group">
          <h1 className="ul-title">Phê duyệt Chợ</h1>
          <p className="ul-subtitle">Quản lý các yêu cầu tạo sơ đồ mặt bằng chợ từ Manager.</p>
        </div>
      </div>

      <div className="ul-content">
        {loading ? (
          <div className="ul-loading-state">
            <div className="ul-spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : markets.length === 0 ? (
          <div className="ul-empty-state">
            <IconEmpty />
            <p className="ul-empty-title">Không có yêu cầu nào</p>
            <p className="ul-empty-desc">Hiện tại không có chợ nào đang chờ phê duyệt.</p>
          </div>
        ) : (
          <div className="ul-table-container">
            <table className="ul-table">
              <thead>
                <tr>
                  <th>Tên Chợ</th>
                  <th>Địa chỉ</th>
                  <th>Kích thước (m²)</th>
                  <th>Khu vực</th>
                  <th>Sạp</th>
                  <th>Trạng thái</th>
                  <th className="ul-col-actions" style={{width: 250}}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {markets.map(m => (
                  <tr key={m.marketId}>
                    <td>
                      <div className="ul-cell-name">
                        <div className="ul-avatar">{m.name?.charAt(0) || m.marketName?.charAt(0) || 'M'}</div>
                        <div>
                          <div className="ul-name-text">{m.name || m.marketName}</div>
                        </div>
                      </div>
                    </td>
                    <td>{m.address}</td>
                    <td>{m.size}</td>
                    <td>{m.areasCount}</td>
                    <td>{m.stallsCount}</td>
                    <td>
                      {m.status === 'Pending' && <span className="ul-badge ul-badge-pending">Đợi phê duyệt</span>}
                      {m.status === 'Active' && <span className="ul-badge ul-badge-active">Hoạt động</span>}
                      {(m.status === 'Rejected' || m.status === 'Inactive') && <span className="ul-badge ul-badge-banned">Từ chối</span>}
                    </td>
                    <td>
                      <div className="ul-actions">
                        <button 
                          className="ul-btn-icon ul-tooltip-wrap" 
                          onClick={() => setViewingMarketId(m.marketId)}
                          disabled={actionLoading}
                        >
                          <IconEye />
                          <span className="ul-tooltip">Xem sơ đồ</span>
                        </button>
                        
                        {m.status === 'Pending' && (
                          <>
                            <button 
                              className="ul-btn-icon ul-btn-unlock ul-tooltip-wrap" 
                              onClick={() => handleApprove(m.marketId)}
                              disabled={actionLoading}
                              style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}
                            >
                              <IconCheck />
                              <span className="ul-tooltip">Phê duyệt</span>
                            </button>
                            <button 
                              className="ul-btn-icon ul-btn-lock ul-tooltip-wrap" 
                              onClick={() => handleReject(m.marketId)}
                              disabled={actionLoading}
                            >
                              <IconX />
                              <span className="ul-tooltip">Từ chối</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
