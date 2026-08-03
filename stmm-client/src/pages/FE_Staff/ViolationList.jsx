import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import { getEnumCls, getEnumLabel, VIOLATION_STATUS_MAP } from '../../constants/enumMaps';
import './ViolationList.css';

const PAGE_SIZE = 5;

const readProblemDetail = async (response, t) => {
  try {
    const problem = await response.json();
    return problem.detail || problem.title || t('violationlist.unable_to_load_violations');
  } catch {
    return t('violationlist.unable_to_load_violations');
  }
};

export default function ViolationList({ baseUrl, onViewDetails, onOpenCreateModal }) {
  const { t, i18n } = useTranslation();

  const [violations, setViolations] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchViolations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${baseUrl}/api/violations`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error(await readProblemDetail(response, t));
      const data = await response.json();
      setViolations(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setViolations([]);
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, t]);

  useEffect(() => { fetchViolations(); }, [fetchViolations]);

  const filteredViolations = useMemo(() => {
    const normalizedSearch = appliedSearch.trim().toLowerCase();
    if (!normalizedSearch) return violations;

    return violations.filter((violation) => [
      violation.violationId,
      violation.title,
      violation.description,
      violation.stallCode,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch)));
  }, [appliedSearch, violations]);

  const totalCount = filteredViolations.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePageNumber = Math.min(pageNumber, totalPages);
  const visibleViolations = useMemo(() => {
    const startIndex = (safePageNumber - 1) * PAGE_SIZE;
    return filteredViolations.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredViolations, safePageNumber]);

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
          <input type="search" className="search-input" placeholder={t('violationlist.search_violations_by_id')} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
          <button type="submit" className="btn-secondary">{t('violationlist.search')}</button>
          {appliedSearch ? <button type="button" className="btn-filter-clear" onClick={() => { setSearchQuery(''); setAppliedSearch(''); setPageNumber(1); }}>{t('violationlist.clear')}</button> : null}
        </form>
        <button type="button" className="btn-primary" onClick={onOpenCreateModal}>+ {t('violationlist.report_violation')}</button>
      </div>

      {loading ? <div className="loading-state">{t('violationlist.loading_violations')}</div> : null}
      {!loading && error ? <div className="error-state"><p className="error-message">{error}</p><button className="btn-secondary" onClick={fetchViolations}>{t('violationlist.retry')}</button></div> : null}
      {!loading && !error && visibleViolations.length === 0 ? <div className="empty-state"><p>{t('violationlist.no_violations_found')}</p></div> : null}
      {!loading && !error && visibleViolations.length > 0 ? (
        <>
          <div className="table-card">
            <div className="table-card-header"><span className="table-card-title">{t('violationlist.violations')}</span><span className="table-count-badge">{t('violationlist.violation_count', { count: totalCount })}</span></div>
            <div className="table-responsive">
              <table className="staff-table">
                <thead><tr><th>{t('violationlist.id')}</th><th>{t('violationlist.violation')}</th><th>{t('violationlist.location')}</th><th>{t('violationlist.fine')}</th><th>{t('violationlist.status')}</th><th>{t('violationlist.reported')}</th><th>{t('violationlist.action')}</th></tr></thead>
                <tbody>
                  {visibleViolations.map((violation) => (
                    <tr key={violation.violationId}>
                      <td><strong>#{violation.violationId}</strong></td>
                      <td>{violation.title}</td>
                      <td><span className="badge-stall">{violation.stallCode || t('violationlist.unknown_stall')}</span></td>
                      <td>{Number(violation.fineAmount || 0).toLocaleString(i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US')} VND</td>
                      <td><span className={`status-badge ${getEnumCls(violation.status, VIOLATION_STATUS_MAP, 'pending')}`}>{getEnumLabel(violation.status || 'Pending', VIOLATION_STATUS_MAP, t)}</span></td>
                      <td>{violation.createdAt ? new Date(violation.createdAt).toLocaleDateString(i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US') : t('violationlist.na')}</td>
                      <td><button type="button" className="btn-link" onClick={() => onViewDetails(violation.violationId)}>{t('violationlist.view_details')}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 ? (
            <div className="pagination-wrapper">
              <span className="pagination-info">{t('violationlist.page_of', { page: safePageNumber, totalPages })}</span>
              <div className="pagination-buttons">
                <button className="btn-page" onClick={() => setPageNumber((page) => Math.max(1, page - 1))} disabled={safePageNumber === 1}>{t('violationlist.prev')}</button>
                <button className="btn-page" onClick={() => setPageNumber((page) => Math.min(totalPages, page + 1))} disabled={safePageNumber === totalPages}>{t('violationlist.next')}</button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
