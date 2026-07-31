import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import { getEnumCls, getEnumLabel, ISSUE_STATUS_MAP } from '../../constants/enumMaps';
import './IssueList.css';

const PAGE_SIZE = 5;

const readProblemDetail = async (response, t) => {
  try {
    const problem = await response.json();
    return problem.detail || problem.title || t('issuelist.unable_to_load_issues');
  } catch {
    return t('issuelist.unable_to_load_issues');
  }
};

export default function IssueList({ baseUrl, onViewDetails, onOpenCreateModal }) {
  const { t, i18n } = useTranslation();

  const [issues, setIssues] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${baseUrl}/api/staff/issues`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error(await readProblemDetail(response, t));
      const data = await response.json();
      setIssues(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setIssues([]);
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, t]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const filteredIssues = useMemo(() => {
    const normalizedSearch = appliedSearch.trim().toLowerCase();
    if (!normalizedSearch) return issues;

    return issues.filter((issue) => [
      issue.issueId,
      issue.title,
      issue.description,
      issue.stallCode,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch)));
  }, [appliedSearch, issues]);

  const totalCount = filteredIssues.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePageNumber = Math.min(pageNumber, totalPages);
  const visibleIssues = useMemo(() => {
    const startIndex = (safePageNumber - 1) * PAGE_SIZE;
    return filteredIssues.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredIssues, safePageNumber]);

  useEffect(() => {
    if (pageNumber !== safePageNumber) setPageNumber(safePageNumber);
  }, [pageNumber, safePageNumber]);

  const applySearch = (event) => {
    event.preventDefault();
    setPageNumber(1);
    setAppliedSearch(searchQuery.trim());
  };

  return (
    <main className="violation-list-container">
      <div className="toolbar">
        <form onSubmit={applySearch} className="search-wrap">
          <input
            type="search"
            className="search-input"
            placeholder={t('issuelist.search_issues_by_id')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <button type="submit" className="btn-secondary">{t('issuelist.search')}</button>
          {appliedSearch ? (
            <button type="button" className="btn-filter-clear" onClick={() => { setSearchQuery(''); setAppliedSearch(''); setPageNumber(1); }}>{t('issuelist.clear')}</button>
          ) : null}
        </form>
        <button type="button" className="btn-primary" onClick={onOpenCreateModal}>+ {t('issuelist.report_new_issue')}</button>
      </div>

      {loading ? <div className="loading-state">{t('issuelist.loading_issues')}</div> : null}
      {!loading && error ? <div className="error-state"><p className="error-message">{error}</p><button className="btn-secondary" onClick={fetchIssues}>{t('issuelist.retry')}</button></div> : null}
      {!loading && !error && visibleIssues.length === 0 ? <div className="empty-state"><p>{t('issuelist.no_issues_found')}</p></div> : null}
      {!loading && !error && visibleIssues.length > 0 ? (
        <>
          <div className="table-card">
            <div className="table-card-header"><span className="table-card-title">{t('issuelist.issues')}</span><span className="table-count-badge">{t('issuelist.issue_count', { count: totalCount })}</span></div>
            <div className="table-responsive">
              <table className="staff-table">
                <thead><tr><th>{t('issuelist.id')}</th><th>{t('issuelist.issue')}</th><th>{t('issuelist.location')}</th><th>{t('issuelist.status')}</th><th>{t('issuelist.reported')}</th><th>{t('issuelist.action')}</th></tr></thead>
                <tbody>
                  {visibleIssues.map((issue) => (
                    <tr key={issue.issueId}>
                      <td><strong>#{issue.issueId}</strong></td>
                      <td>{issue.title}</td>
                      <td><span className="badge-stall">{issue.stallCode || t('issuelist.unknown_stall')}</span></td>
                      <td><span className={`status-badge ${getEnumCls(issue.status, ISSUE_STATUS_MAP, 'reported')}`}>{getEnumLabel(issue.status || 'Reported', ISSUE_STATUS_MAP, t)}</span></td>
                      <td>{issue.createdAt ? new Date(issue.createdAt).toLocaleDateString(i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US') : t('issuelist.na')}</td>
                      <td><button type="button" className="btn-link" onClick={() => onViewDetails(issue.issueId)}>{t('issuelist.view_details')}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 ? (
            <div className="pagination-wrapper">
              <span className="pagination-info">{t('issuelist.page_of', { page: safePageNumber, totalPages })}</span>
              <div className="pagination-buttons">
                <button className="btn-page" onClick={() => setPageNumber((page) => Math.max(1, page - 1))} disabled={safePageNumber === 1}>{t('issuelist.prev')}</button>
                <button className="btn-page" onClick={() => setPageNumber((page) => Math.min(totalPages, page + 1))} disabled={safePageNumber === totalPages}>{t('issuelist.next')}</button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
