import { useState, useEffect, useRef } from 'react';
import './RequestListManager.css';

const API_BASE = "http://localhost:5056/api/manager/requests";
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`
});

const TYPE_META = {
  FacilityIssue:   { label: 'Sự cố hạ tầng',      color: 'type-facility' },
  ViolationAppeal: { label: 'Kháng nghị vi phạm',  color: 'type-violation' },
  InvoiceDispute:  { label: 'Khiếu nại hóa đơn',   color: 'type-invoice' },
};

const STATUS_META = {
  PendingManagerReview: { label: 'Báo giá chờ quyết định', cls: 'status-review' },
  Pending:   { label: 'Chờ xử lý',       cls: 'status-pending'   },
  Quoted:    { label: 'Báo giá',          cls: 'status-quoted'    },
  Approved:  { label: 'Đã duyệt',        cls: 'status-approved'  },
  Completed: { label: 'Hoàn thành',      cls: 'status-completed' },
  Rejected:  { label: 'Từ chối',         cls: 'status-rejected'  },
};

/* ── Icons ── */
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconInbox = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </svg>
);
const IconChevronLeft = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

export default function RequestListManager({ navigate, addToast }) {
  const [requests, setRequests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const searchRef = useRef(null);

  useEffect(() => { setPage(1); }, [searchQuery, statusFilter, typeFilter]);
  useEffect(() => { fetchRequests(); }, [searchQuery, statusFilter, typeFilter, page]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}?pageNumber=${page}&pageSize=${pageSize}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
      if (typeFilter)   url += `&requestType=${encodeURIComponent(typeFilter)}`;
      if (searchQuery)  url += `&searchTerm=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRequests(data.items || []);
      setTotalCount(data.totalCount || 0);
    } catch {
      addToast('Không thể tải danh sách yêu cầu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const formatDate = (s) => {
    if (!s) return '—';
    try {
      const d = new Date(s);
      return d.toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
    } catch { return s; }
  };

  const hasFilters = searchQuery || statusFilter || typeFilter;

  return (
    <div className="rl-container">

      {/* ── Toolbar ── */}
      <div className="rl-toolbar">
        <div className="rl-search-wrap">
          <span className="rl-search-icon"><IconSearch /></span>
          <input
            ref={searchRef}
            className="rl-search-input"
            type="text"
            placeholder="Tìm theo tiêu đề, sạp, tiểu thương..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="rl-search-clear" onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}>✕</button>
          )}
        </div>

        <div className="rl-selects">
          <div className="rl-select-wrap">
            <IconFilter />
            <select className="rl-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">Tất cả loại</option>
              {Object.entries(TYPE_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div className="rl-select-wrap">
            <IconFilter />
            <select className="rl-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        <div className="rl-count-badge">
          {loading ? '—' : totalCount} yêu cầu
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="rl-loading">
          <div className="rl-spinner" />
          <span>Đang tải dữ liệu...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="rl-empty">
          <div className="rl-empty-icon"><IconInbox /></div>
          <h3>Không có yêu cầu nào</h3>
          <p>{hasFilters ? 'Không có kết quả phù hợp với bộ lọc hiện tại.' : 'Chưa có yêu cầu nào được gửi lên hệ thống.'}</p>
          {hasFilters && (
            <button className="rl-clear-filters" onClick={() => { setSearchQuery(''); setStatusFilter(''); setTypeFilter(''); }}>
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="rl-table-wrap">
            <table className="rl-table">
              <thead>
                <tr>
                  <th>Mã YC</th>
                  <th>Sạp</th>
                  <th>Tiểu thương</th>
                  <th>Loại yêu cầu</th>
                  <th>Tiêu đề</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th style={{textAlign:'center'}}>Xem</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(item => {
                  const tm = TYPE_META[item.requestType] || { label: item.requestType, color: 'type-other' };
                  const sm = STATUS_META[item.status]    || { label: item.status,       cls: 'status-pending' };
                  return (
                    <tr
                      key={item.requestId}
                      className={`rl-row ${item.status === 'PendingManagerReview' ? 'rl-row-needs-review' : ''}`}
                      onClick={() => navigate('request-detail', item.requestId)}
                    >
                      <td>
                        <span className="rl-id-badge">REQ-{item.requestId}</span>
                      </td>
                      <td>
                        <span className="rl-stall-badge">{item.stallCode || '—'}</span>
                      </td>
                      <td>
                        <div className="rl-vendor-cell">
                          <span className="rl-vendor-biz">{item.businessName || '—'}</span>
                          <span className="rl-vendor-name">{item.vendorName || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`rl-type-badge ${tm.color}`}>{tm.label}</span>
                      </td>
                      <td>
                        <div className="rl-title-cell">
                          <span className="rl-title-text">{item.title}</span>
                          <span className="rl-desc-snip">{item.description}</span>
                        </div>
                      </td>
                      <td>
                        <span className="rl-date">{formatDate(item.createdAt)}</span>
                      </td>
                      <td>
                        <span className={`rl-status-badge ${sm.cls}`}>{sm.label}</span>
                      </td>
                      <td style={{textAlign:'center'}}>
                        <button
                          className="rl-view-btn"
                          onClick={e => { e.stopPropagation(); navigate('request-detail', item.requestId); }}
                          title="Xem chi tiết"
                        >
                          <IconEye />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div className="rl-pagination">
            <button className="rl-page-btn" onClick={() => setPage(p => Math.max(p-1, 1))} disabled={page === 1}>
              <IconChevronLeft /> Trước
            </button>
            <div className="rl-page-nums">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i-1] > 1) acc.push('...');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === '...'
                    ? <span key={`e${i}`} className="rl-page-ellipsis">…</span>
                    : <button key={n} className={`rl-page-num ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                )
              }
            </div>
            <button className="rl-page-btn" onClick={() => setPage(p => Math.min(p+1, totalPages))} disabled={page === totalPages}>
              Sau <IconChevronRight />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
