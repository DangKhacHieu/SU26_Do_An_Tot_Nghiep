import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import './IssueListManager.css';

const STATUS_META = {
  Reported:   { labelKey: 'new_report',  labelFallback: 'Báo cáo mới',   cls: 'status-pending'   },
  InProgress: { labelKey: 'processing',  labelFallback: 'Đang xử lý',    cls: 'status-quoted'    },
  Resolved:   { labelKey: 'resolved',    labelFallback: 'Đã giải quyết', cls: 'status-approved'  },
  Closed:     { labelKey: 'closed',      labelFallback: 'Đã đóng',       cls: 'status-completed' },
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


export default function IssueListManager({ userId, baseUrl, navigate, addToast }) {
  const { t, i18n } = useTranslation();

  const [issues, setIssues] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const searchRef = useRef(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${baseUrl}/api/manager/issues?pageNumber=${page}&pageSize=${pageSize}&sortDescending=true`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;

      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();

      let items = data.items || [];
      // Apply client-side search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        items = items.filter(i => 
          i.issueId.toString().includes(query) ||
          (i.stallCode && i.stallCode.toLowerCase().includes(query)) ||
          (i.title && i.title.toLowerCase().includes(query)) ||
          (i.description && i.description.toLowerCase().includes(query)) ||
          (i.createdByName && i.createdByName.toLowerCase().includes(query))
        );
      }

      setIssues(items);
      setTotalCount(data.totalCount || 0);
    } catch {
      addToast(t('issuelistmanager.unable_to_load_issues'), 'error');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, page, pageSize, searchQuery, statusFilter, addToast]);

  useEffect(() => { setPage(1); }, [searchQuery, statusFilter]);
  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const formatDate = (s) => {
    if (!s) return '—';
    try {
      const d = new Date(s);
      return d.toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
    } catch { return s; }
  };

  const hasFilters = searchQuery || statusFilter;

  return (
    <div className="il-container">
      {/* ── Toolbar ── */}
      <div className="il-toolbar">
        <div className="il-search-wrap">
          <span className="il-search-icon"><IconSearch /></span>
          <input
            ref={searchRef}
            className="il-search-input"
            type="text"
            placeholder={t('issuelistmanager.search_by_title_store')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="il-search-clear" onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}>✕</button>
          )}
        </div>

        <div className="il-selects">
          <div className="il-select-wrap">
            <IconFilter />
            <select className="il-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">{t('issuelistmanager.all_status')}</option>
              {Object.entries(STATUS_META).map(([k,v]) => <option key={k} value={k}>{t('issuelistmanager.' + v.labelKey)}</option>)}
            </select>
          </div>
        </div>

        <div className="il-count-badge">
          {t('issuelistmanager.issues_count', { count: loading ? '—' : totalCount })}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="il-loading">
          <div className="il-spinner" />
          <span>{t('issuelistmanager.loading_problem_list')}</span>
        </div>
      ) : issues.length === 0 ? (
        <div className="il-empty">
          <div className="il-empty-icon"><IconInbox /></div>
          <h3>{t('issuelistmanager.no_problems_found')}</h3>
          <p>{hasFilters ? t('issuelistmanager.there_are_no_matches') : t('issuelistmanager.no_infrastructure_problems_have')}</p>
          {hasFilters && (
            <button className="il-clear-filters" onClick={() => { setSearchQuery(''); setStatusFilter(''); }}>
              {t('issuelistmanager.clear_filter')}</button>
          )}
        </div>
      ) : (
        <>
          <div className="il-table-wrap">
            <div className="table-responsive">
              <table className="il-table">
                <thead>
                  <tr>
                    <th>{t('issuelistmanager.trouble_code')}</th>
                    <th>{t('issuelistmanager.stall')}</th>
                    <th>{t('issuelistmanager.incident_title')}</th>
                    <th>{t('issuelistmanager.annunciator')}</th>
                    <th>{t('issuelistmanager.report_date')}</th>
                    <th>{t('issuelistmanager.status')}</th>
                    <th className="actions-header">{t('issuelistmanager.view')}</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map(item => {
                    const sm = STATUS_META[item.status] || { labelKey: '', labelFallback: item.status, cls: 'status-pending' };
                    return (
                      <tr key={item.issueId} className="il-row" onClick={() => navigate('issue-details', item.issueId)}>
                        <td>
                          <span className="il-id-badge">#ISSUE-{item.issueId}</span>
                        </td>
                        <td>
                          <span className="il-stall-badge">{item.stallCode || t('issuelistmanager.stall_id_itemstallid')}</span>
                        </td>
                        <td>
                          <div className="il-title-cell">
                            <span className="il-title-text">{item.title}</span>
                            <span className="il-desc-snip">{item.description}</span>
                          </div>
                        </td>
                        <td>
                          <span className="il-reporter">{item.createdByName || `Staff #${item.createdByUserId}`}</span>
                        </td>
                        <td>
                          <span className="il-date">{formatDate(item.createdAt)}</span>
                        </td>
                        <td>
                          <span className={`il-status-badge ${sm.cls}`}>{sm.labelKey ? t('issuelistmanager.' + sm.labelKey) : sm.labelFallback}</span>
                        </td>
                        <td className="actions-cell" onClick={e => e.stopPropagation()}>
                          <button className="btn-view-detail" onClick={() => navigate('issue-details', item.issueId)}>
                            {t('issuelistmanager.view_incident_details')}<IconEye />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="il-pagination">
              <button
                className="il-page-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <IconChevronLeft /> {t('issuelistmanager.before')}</button>

              <div className="il-page-nums">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    className={`il-page-num ${page === num ? 'active' : ''}`}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                className="il-page-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                {t('issuelistmanager.next')} <IconChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
