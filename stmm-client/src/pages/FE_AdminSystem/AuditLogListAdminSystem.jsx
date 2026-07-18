import { useState, useEffect } from 'react';
import './AuditLogListAdminSystem.css';

const API_BASE = "http://localhost:5056/api/admin/audit-logs";

/* ── Icons ── */
const IconSearch   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconCalendar = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconInfo     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const IconEmpty    = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconXCircle  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const IconAlertTriangle = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconShieldAlert = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

const ROLE_COLORS = {
  staff:          '#2563eb',
  accountant:     '#7c3aed',
  vendor:         '#0f766e',
  customer:       '#d97706',
  manager:        '#f43f5e',
  'admin system': '#8b5cf6',
  admin:          '#8b5cf6',
};

export default function AuditLogListAdminSystem({ navigate, addToast }) {
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [page, setPage]               = useState(1);
  const [pageSize]                    = useState(15);
  const [totalCount, setTotalCount]   = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  
  // Real-time connection status
  const [hubConnected, setHubConnected] = useState(false);

  // Log Details Modal
  const [selectedLog, setSelectedLog] = useState(null);

  // 1. Fetch historical logs
  useEffect(() => {
    fetchLogs();
  }, [searchQuery, actionFilter, startDate, endDate, page]);

  // 2. Establish SignalR real-time connection
  useEffect(() => {
    let connection;

    const startConnection = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        // Dynamic base resolution matching VITE_API_URL or API_BASE to prevent port mismatches
        const apiBaseUrl = (import.meta.env.VITE_API_URL || API_BASE).split('/api')[0];
        const hubUrl = `${apiBaseUrl}/hubs/audit-logs`;
        
        // Dynamically import SignalR to keep bundles decoupled
        const { HubConnectionBuilder, LogLevel } = await import('@microsoft/signalr');
        
        connection = new HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: () => token
          })
          .configureLogging(LogLevel.Warning)
          .withAutomaticReconnect()
          .build();

        // Listen for new audit logs broadcasted from the server
        connection.on("ReceiveAuditLog", (newLog) => {
          // Verify if the incoming log matches current filters before adding it to active UI
          if (searchQuery) {
            const search = searchQuery.toLowerCase();
            const nameMatch = newLog.userName?.toLowerCase().includes(search);
            const emailMatch = newLog.userEmail?.toLowerCase().includes(search);
            if (!nameMatch && !emailMatch) return;
          }
          if (actionFilter) {
            const action = actionFilter.toLowerCase();
            if (!newLog.action?.toLowerCase().includes(action)) return;
          }
          if (startDate && new Date(newLog.createdAt) < new Date(startDate)) return;
          if (endDate) {
            const endLimit = new Date(endDate);
            endLimit.setDate(endLimit.getDate() + 1);
            if (new Date(newLog.createdAt) > endLimit) return;
          }

          // Prepend the new log to the list, keeping size bounded by current page limit
          setLogs((prev) => {
            if (prev.some(l => l.logId === newLog.logId)) return prev; // avoid duplicates
            const updated = [newLog, ...prev];
            return updated.slice(0, pageSize);
          });
          
          setTotalCount((prev) => prev + 1);
        });

        connection.onreconnecting(() => {
          setHubConnected(false);
        });

        connection.onreconnected(() => {
          setHubConnected(true);
          addToast('Đã kết nối lại hệ thống thời gian thực.', 'success');
        });

        await connection.start();
        setHubConnected(true);
      } catch (err) {
        console.error("SignalR Audit Log Hub connection failed:", err);
        setHubConnected(false);
      }
    };

    startConnection();

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [searchQuery, actionFilter, startDate, endDate, pageSize]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        addToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
        navigate('login');
        return;
      }

      let url = `${API_BASE}?pageNumber=${page}&pageSize=${pageSize}&`;
      if (searchQuery)  url += `search=${encodeURIComponent(searchQuery)}&`;
      if (actionFilter) url += `action=${encodeURIComponent(actionFilter)}&`;
      if (startDate)    url += `startDate=${encodeURIComponent(startDate)}&`;
      if (endDate)      url += `endDate=${encodeURIComponent(endDate)}&`;

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(data.items || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        if (res.status === 401 || res.status === 403) {
          addToast('Bạn không có quyền truy cập nhật ký hệ thống.', 'error');
        } else {
          throw new Error();
        }
      }
    } catch {
      addToast('Không thể tải nhật ký hoạt động.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActionFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasFilters = searchQuery || actionFilter || startDate || endDate;

  // Determine priority/alert level of actions to highlight abnormal activities
  const getActionSeverity = (actionText) => {
    if (!actionText) return 'info';
    const text = actionText.toLowerCase();
    
    // Critical risk keywords (e.g. deletion, account locking, rejection, deactivation, failure)
    if (text.includes('xóa') || text.includes('khóa') || text.includes('từ chối') || text.includes('hủy kích hoạt') || text.includes('thất bại')) {
      return 'danger'; 
    }
    
    // Medium risk/noteworthy keywords (e.g. unlocks, password resets, modifications)
    if (text.includes('mở khóa') || text.includes('đặt lại mật khẩu') || text.includes('thay đổi mật khẩu') || text.includes('reset') || text.includes('cập nhật')) {
      return 'warning'; 
    }

    // Normal successful creations/approvals
    if (text.includes('tạo') || text.includes('phê duyệt') || text.includes('đăng ký') || text.includes('đăng nhập')) {
      return 'success'; 
    }

    return 'info';
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="user-list-container audit-log-container">
      {/* ── Page Header ── */}
      <div className="list-header">
        <div>
          <h2>Nhật ký hoạt động hệ thống</h2>
          <p className="header-subtitle">
            Giám sát thao tác thời gian thực của mọi tài khoản người dùng trên toàn hệ thống
          </p>
        </div>
      </div>

      {/* ── Filters bar ── */}
      <div className="filter-card">
        <div className="filter-grid">
          {/* Search User */}
          <div className="search-box">
            <span className="search-icon"><IconSearch /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Tìm theo tên, email User..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => { setSearchQuery(''); setPage(1); }} title="Xóa">
                <IconXCircle />
              </button>
            )}
          </div>

          {/* Action Filter */}
          <div className="search-box">
            <span className="search-icon"><IconSearch /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Lọc hành động (Khóa, Duyệt, Tạo)..."
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            />
            {actionFilter && (
              <button className="search-clear" onClick={() => { setActionFilter(''); setPage(1); }} title="Xóa">
                <IconXCircle />
              </button>
            )}
          </div>

          {/* Start Date */}
          <div className="date-input-wrap">
            <span className="date-icon"><IconCalendar /></span>
            <input
              type="date"
              className="form-control date-control"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              title="Từ ngày"
            />
          </div>

          {/* End Date */}
          <div className="date-input-wrap">
            <span className="date-icon"><IconCalendar /></span>
            <input
              type="date"
              className="form-control date-control"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              title="Đến ngày"
            />
          </div>
        </div>

        {hasFilters && (
          <div className="filter-actions" style={{ marginTop: '12px', textAlign: 'right' }}>
            <button className="btn-filter-clear" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* ── Table Card ── */}
      <div className="table-card">
        <div className="table-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="table-card-title">Lịch sử tác vụ hệ thống</span>
            {hubConnected && (
              <span className="live-indicator" title="Đang kết nối thời gian thực qua WebSockets">
                <span className="live-dot" />
                <span className="live-text">Real-time</span>
              </span>
            )}
          </div>
          {!loading && (
            <span className="table-count-badge badge-admin">{totalCount} tác vụ</span>
          )}
        </div>

        {loading ? (
          <div className="state-empty">
            <div className="spinner" />
            <span className="state-empty-text">Đang tải nhật ký hệ thống...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="state-empty">
            <IconEmpty />
            <span className="state-empty-text">
              {hasFilters ? 'Không tìm thấy nhật ký phù hợp với bộ lọc.' : 'Chưa ghi nhận bất kỳ thao tác nào.'}
            </span>
            {hasFilters && (
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="user-table audit-table">
                <thead>
                  <tr>
                    <th style={{ width: 60, textAlign: 'center' }}>ID</th>
                    <th>Người thực hiện</th>
                    <th>Hành động</th>
                    <th>Địa chỉ IP</th>
                    <th>Thời gian</th>
                    <th style={{ width: 100, textAlign: 'center' }}>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const severity = getActionSeverity(log.action);
                    return (
                      <tr 
                        key={log.logId}
                        className={severity === 'danger' ? 'row-critical-danger' : severity === 'warning' ? 'row-critical-warning' : ''}
                      >
                        <td style={{ textAlign: 'center', fontWeight: '500', color: '#64748b' }}>
                          #{log.logId}
                        </td>
                        <td>
                          <div className="user-cell">
                            <div 
                              className="user-avatar" 
                              style={{ background: ROLE_COLORS[log.roleName?.toLowerCase()] || '#64748b' }}
                            >
                              {log.userName ? log.userName[0].toUpperCase() : 'U'}
                            </div>
                            <div className="user-meta">
                              <span className="user-name">{log.userName || 'Unknown User'}</span>
                              <span className="user-email">{log.userEmail || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="action-cell-content">
                            {severity === 'danger' && (
                              <span className="critical-badge badge-danger-alert" title="Hành động rủi ro cao / Bất thường">
                                <IconShieldAlert /> Cảnh báo
                              </span>
                            )}
                            {severity === 'warning' && (
                              <span className="critical-badge badge-warning-alert" title="Hành động cần lưu ý">
                                <IconAlertTriangle /> Lưu ý
                              </span>
                            )}
                            <span className={`action-text severity-${severity}`}>
                              {log.action}
                            </span>
                          </div>
                        </td>
                        <td>
                          <code className="ip-badge">{log.ipAddress || 'Unknown'}</code>
                        </td>
                        <td>
                          <span className="time-text">{formatDateTime(log.createdAt)}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="btn-icon view-details" 
                            title="Xem chi tiết dòng log"
                            onClick={() => setSelectedLog(log)}
                          >
                            <IconInfo />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <span className="pagination-info">
                  Trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Hiển thị {logs.length} / {totalCount} kết quả)
                </span>
                <div className="pagination-buttons">
                  <button 
                    className="btn-pagination" 
                    onClick={() => setPage(p => Math.max(p - 1, 1))} 
                    disabled={page === 1}
                  >
                    Trước
                  </button>
                  <button 
                    className="btn-pagination" 
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))} 
                    disabled={page === totalPages}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal: Detail View ── */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-box audit-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Chi tiết nhật ký hoạt động #{selectedLog.logId}</h3>
              <button className="modal-close" onClick={() => setSelectedLog(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="audit-detail-grid">
                <div className="detail-item full-width">
                  <label>Mô tả hành động</label>
                  <div className={`detail-value action-value-box severity-${getActionSeverity(selectedLog.action)}`}>
                    {selectedLog.action}
                  </div>
                </div>

                <div className="detail-item">
                  <label>Người thực hiện</label>
                  <div className="detail-value text-bold">{selectedLog.userName}</div>
                </div>

                <div className="detail-item">
                  <label>Email</label>
                  <div className="detail-value">{selectedLog.userEmail}</div>
                </div>

                <div className="detail-item">
                  <label>Vai trò hệ thống</label>
                  <div className="detail-value">
                    <span 
                      className="badge-role" 
                      style={{ 
                        backgroundColor: (ROLE_COLORS[selectedLog.roleName?.toLowerCase()] || '#64748b') + '15',
                        color: ROLE_COLORS[selectedLog.roleName?.toLowerCase()] || '#64748b',
                        border: `1px solid ${(ROLE_COLORS[selectedLog.roleName?.toLowerCase()] || '#64748b')}30`,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      {selectedLog.roleName}
                    </span>
                  </div>
                </div>

                <div className="detail-item">
                  <label>Mã tài khoản (User ID)</label>
                  <div className="detail-value">#{selectedLog.userId}</div>
                </div>

                <div className="detail-item">
                  <label>Địa chỉ IP</label>
                  <div className="detail-value"><code>{selectedLog.ipAddress || 'Không rõ'}</code></div>
                </div>

                <div className="detail-item">
                  <label>Thời điểm ghi nhận (GMT+7)</label>
                  <div className="detail-value">{formatDateTime(selectedLog.createdAt)}</div>
                </div>
              </div>

              {getActionSeverity(selectedLog.action) === 'danger' && (
                <div className="critical-warning-box">
                  <div className="warning-icon-wrapper">⚠️</div>
                  <div>
                    <p className="warning-title">Tác vụ nhạy cảm / Rủi ro cao</p>
                    <p className="warning-desc">
                      Tác vụ này làm thay đổi quyền lực, trạng thái hoặc xóa thông tin người dùng/dữ liệu sạp. Yêu cầu kiểm tra kỹ nếu thao tác này không phải do quản trị viên chủ động thực hiện.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn-secondary" onClick={() => setSelectedLog(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
