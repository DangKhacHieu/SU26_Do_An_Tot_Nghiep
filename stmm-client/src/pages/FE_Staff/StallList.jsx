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
      case 'MeterReading': return 'Ghi Điện Nước';
      case 'CashCollection': return 'Thu Tiền Mặt';
      case 'Repair': return 'Sửa Chữa';
      case 'Maintenance': return 'Bảo Trì';
      default: return type;
    }
  };

  return (
    <div className="stall-list-page">
      <div className="breadcrumb-path">
        <span>Dashboard</span> &gt; <span className="active-path">Stalls Checklist</span>
      </div>

      <div className="section-header">
        <div>
          <h1 className="main-title">🏪 Danh Sách Sạp Đi Tuần</h1>
          <p className="subtitle">Xem danh sách các sạp cần thực hiện nhiệm vụ ghi chỉ số hoặc thu nợ.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filters-wrapper">
        <form onSubmit={handleSearchSubmit} className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm theo mã sạp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-input"
          />
          <button type="submit" className="btn-search">Tìm kiếm</button>
        </form>

        <div className="filter-tabs">
          <button 
            className={`tab-btn ${filterType === 'All' ? 'active' : ''}`}
            onClick={() => { setFilterType('All'); setPageNumber(1); }}
          >
            Tất cả
          </button>
          <button 
            className={`tab-btn ${filterType === 'HasTask' ? 'active' : ''}`}
            onClick={() => { setFilterType('HasTask'); setPageNumber(1); }}
          >
            📋 Có nhiệm vụ
          </button>
          <button 
            className={`tab-btn ${filterType === 'HasUnpaidInvoice' ? 'active' : ''}`}
            onClick={() => { setFilterType('HasUnpaidInvoice'); setPageNumber(1); }}
          >
            💰 Nợ hóa đơn
          </button>
        </div>

        <button type="button" className="btn-secondary-outline" onClick={handleResetFilters}>
          Xóa lọc
        </button>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="loading-state">Đang tải danh sách sạp...</div>
      ) : error ? (
        <div className="error-state">
          <p className="error-message">Lỗi: {error}</p>
          <button className="btn-secondary" onClick={fetchStalls}>Thử lại</button>
        </div>
      ) : stalls.length === 0 ? (
        <div className="empty-state">
          <p>Không tìm thấy sạp nào phù hợp với bộ lọc.</p>
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
                    {stall.stallStatus === 'Rented' ? 'Đang thuê' : stall.stallStatus}
                  </span>
                </div>

                <div className="stall-card-body">
                  <div className="info-row">
                    <span className="info-label">Danh mục:</span>
                    <span className="info-value">{stall.stallCategory || 'Chưa phân loại'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Chủ sạp:</span>
                    <span className="info-value font-semibold">{stall.vendorName || 'N/A'}</span>
                  </div>
                  {stall.vendorPhone && (
                    <div className="info-row">
                      <span className="info-label">SĐT:</span>
                      <span className="info-value">{stall.vendorPhone}</span>
                    </div>
                  )}

                  <hr className="card-divider" />

                  {/* Task Tags */}
                  <div className="task-tags-container">
                    <span className="tags-title">Nhiệm vụ đi tuần:</span>
                    {stall.taskTypes.length === 0 ? (
                      <span className="no-tasks-tag">✅ Hoàn thành</span>
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
                      <span>Nợ hóa đơn: <strong>{stall.unpaidInvoiceCount} tháng</strong></span>
                      <span className="debt-total">{stall.unpaidTotalAmount.toLocaleString('vi-VN')} VND</span>
                    </div>
                  )}
                </div>

                <div className="stall-card-actions">
                  <button 
                    className="btn-card-action violation-btn" 
                    onClick={() => openModal('violation', stall.stallId, stall.stallCode)}
                    title="Lập biên bản vi phạm cho sạp này"
                  >
                    ⚠️ Vi phạm
                  </button>

                  {stall.stallStatus === 'Rented' && (
                    <button 
                      className="btn-card-action meter-btn" 
                      onClick={() => onViewMeterHistory(stall.stallId)}
                      title="Xem lịch sử ghi số điện nước"
                    >
                      ⚡ Lịch sử công tơ
                    </button>
                  )}

                  {stall.hasUnpaidInvoice && (
                    <button 
                      className="btn-card-action cash-btn" 
                      onClick={() => onViewInvoices(stall.stallId, stall.stallCode)}
                      title="Xem hóa đơn chưa đóng"
                    >
                      📄 Xem hóa đơn
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="pagination-wrapper">
            <span className="pagination-info">
              Hiển thị {stalls.length} trên tổng số {totalCount} sạp
            </span>
            <div className="pagination-buttons">
              <button 
                className="btn-page" 
                onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
                disabled={pageNumber === 1}
              >
                Trước
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
                Sau
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
            handleModalSuccess(`Đã lập biên bản vi phạm VIO-${newViolation.violationId} thành công cho sạp ${activeStallCode}`)
          }
        />
      )}
    </div>
  );
}
