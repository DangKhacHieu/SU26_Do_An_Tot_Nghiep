import { useState, useEffect } from 'react';
import './ViolationListManager.css';

const API_BASE = "http://localhost:5056/api/manager/violations";

const STATUS_META = {
  Pending:   { label: 'Chờ duyệt',    cls: 'status-pending'   },
  Notified:  { label: 'Đã thông báo', cls: 'status-notified'  },
  Appealed:  { label: 'Kháng nghị',   cls: 'status-appealed'  },
  Finalized: { label: 'Đã kết luận',  cls: 'status-finalized' },
  Approved:  { label: 'Chấp nhận',    cls: 'status-approved'  },
  Rejected:  { label: 'Bị bác bỏ',    cls: 'status-rejected'  },
};

/* ── Icons ── */
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconReset = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
  </svg>
);

export default function ViolationListManager({ navigate, addToast }) {
  const [violations, setViolations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(8);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortDescending, setSortDescending] = useState(true);

  useEffect(() => {
    fetchViolations();
  }, [pageNumber, statusFilter, searchTerm, sortDescending]);

  const fetchViolations = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}?pageNumber=${pageNumber}&pageSize=${pageSize}&sortDescending=${sortDescending}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      if (searchTerm) {
        url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      setViolations(data.items || []);
      setTotalCount(data.totalCount || 0);
    } catch {
      addToast('Không thể tải danh sách vi phạm.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setPageNumber(1);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchTerm('');
    setStatusFilter('');
    setPageNumber(1);
    setSortDescending(true);
  };

  const formatVnd = (amount) => {
    if (amount === undefined || amount === null) return '—';
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="vl-container">
      {/* ── Toolbar / Filter Bar ── */}
      <div className="vl-toolbar">
        <form onSubmit={handleSearchSubmit} className="vl-search-wrap">
          <span className="vl-search-icon"><IconSearch /></span>
          <input
            type="text"
            className="vl-search-input"
            placeholder="Tìm theo ID, Sạp, Tiêu đề, Loại..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        <div className="vl-filters">
          <select
            className="vl-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPageNumber(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="Notified">Đã thông báo</option>
            <option value="Appealed">Kháng nghị</option>
            <option value="Finalized">Đã kết luận</option>
            <option value="Approved">Chấp nhận</option>
            <option value="Rejected">Bị bác bỏ</option>
          </select>

          <select
            className="vl-select"
            value={sortDescending ? "desc" : "asc"}
            onChange={(e) => { setSortDescending(e.target.value === "desc"); setPageNumber(1); }}
          >
            <option value="desc">Mới nhất trước</option>
            <option value="asc">Cũ nhất trước</option>
          </select>

          <button type="button" className="vl-reset-btn" onClick={handleReset} title="Xóa bộ lọc">
            <IconReset /> Làm mới
          </button>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="vl-card">
        {loading ? (
          <div className="vl-loading">
            <div className="vl-spinner" />
            <span>Đang tải danh sách biên bản...</span>
          </div>
        ) : violations.length === 0 ? (
          <div className="vl-empty">
            <p className="vl-empty-text">Không tìm thấy biên bản vi phạm nào.</p>
          </div>
        ) : (
          <div className="vl-table-wrap">
            <table className="vl-table">
              <thead>
                <tr>
                  <th>Mã biên bản</th>
                  <th>Sạp</th>
                  <th>Tiêu đề</th>
                  <th>Tiền phạt</th>
                  <th>Ngày lập</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((v) => {
                  const sm = STATUS_META[v.status] || { label: v.status || 'Pending', cls: 'status-pending' };
                  return (
                    <tr key={v.violationId}>
                      <td className="vl-td-id">VIO-{v.violationId}</td>
                      <td>
                        <span className="vl-stall-badge">{v.stallCode || `Stall ${v.stallId}`}</span>
                      </td>
                      <td className="vl-td-title" title={v.title}>{v.title}</td>
                      <td className="vl-td-fine">{formatVnd(v.fineAmount)}</td>
                      <td className="vl-td-date">{formatDate(v.createdAt)}</td>
                      <td>
                        <span className={`vl-status-badge ${sm.cls}`}>{sm.label}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="vl-action-btn"
                          onClick={() => navigate('violation-details', v.violationId)}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="vl-pagination">
          <button
            className="vl-page-btn"
            disabled={pageNumber === 1}
            onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
          >
            Trước
          </button>
          <span className="vl-page-info">Trang {pageNumber} / {totalPages}</span>
          <button
            className="vl-page-btn"
            disabled={pageNumber === totalPages}
            onClick={() => setPageNumber(p => Math.min(p + 1, totalPages))}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
