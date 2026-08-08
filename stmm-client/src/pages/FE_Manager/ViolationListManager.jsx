import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import './ViolationListManager.css';

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
const IconEye = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

export default function ViolationListManager({ baseUrl, navigate, addToast }) {
  const { t } = useTranslation();

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

  const apiBase = `${baseUrl || "http://localhost:5056"}/api/manager/violations`;

  const fetchViolations = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${apiBase}?pageNumber=${pageNumber}&pageSize=${pageSize}&sortDescending=${sortDescending}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      if (searchTerm) {
        url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
      }

      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      setViolations(data.items || []);
      setTotalCount(data.totalCount || 0);
    } catch {
      addToast(t('violationlistmanager.unable_to_load_violation'), 'error');
    } finally {
      setLoading(false);
    }
  }, [apiBase, pageNumber, pageSize, sortDescending, statusFilter, searchTerm, addToast]);

  useEffect(() => {
    fetchViolations();
  }, [fetchViolations]);

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
            placeholder={t('violationlistmanager.search_by_id_store')}
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
            <option value="">{t('violationlistmanager.all_status')}</option>
            <option value="Pending">{t('violationlistmanager.waiting_for_approval')}</option>
            <option value="Notified">{t('violationlistmanager.notified')}</option>
            <option value="Appealed">{t('violationlistmanager.appeal')}</option>
            <option value="Finalized">{t('violationlistmanager.concluded')}</option>
            <option value="Approved">{t('violationlistmanager.accept')}</option>
            <option value="Rejected">{t('violationlistmanager.rejected')}</option>
          </select>

          <select
            className="vl-select"
            value={sortDescending ? "desc" : "asc"}
            onChange={(e) => { setSortDescending(e.target.value === "desc"); setPageNumber(1); }}
          >
            <option value="desc">{t('violationlistmanager.newest_first')}</option>
            <option value="asc">{t('violationlistmanager.oldest_first')}</option>
          </select>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="vl-card">
        {loading ? (
          <div className="vl-loading">
            <div className="vl-spinner" />
            <span>{t('violationlistmanager.loading_list_of_minutes')}</span>
          </div>
        ) : violations.length === 0 ? (
          <div className="vl-empty">
            <p className="vl-empty-text">{t('violationlistmanager.no_violation_records_were')}</p>
          </div>
        ) : (
          <div className="vl-table-wrap">
            <table className="vl-table">
              <thead>
                <tr>
                  <th>{t('violationlistmanager.minute_code')}</th>
                  <th>{t('violationlistmanager.stall')}</th>
                  <th>{t('violationlistmanager.title')}</th>
                  <th>{t('violationlistmanager.fine')}</th>
                  <th>{t('violationlistmanager.date_of_establishment')}</th>
                  <th>{t('violationlistmanager.status')}</th>
                  <th style={{ textAlign: 'right' }}>{t('violationlistmanager.operation')}</th>
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
                          className="btn-view-detail"
                          onClick={() => navigate('violation-details', v.violationId)}
                        >
                          {t('violationlistmanager.detail')}<IconEye />
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
            {t('violationlistmanager.before')}</button>
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
