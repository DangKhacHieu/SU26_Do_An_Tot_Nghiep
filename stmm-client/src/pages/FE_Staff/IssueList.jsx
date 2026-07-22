import { useCallback, useEffect, useState } from 'react';
import './IssueList.css';

const PAGE_SIZE = 8;

const readProblemDetail = async (response) => {
  try {
    const problem = await response.json();
    return problem.detail || problem.title || 'Unable to load issues.';
  } catch {
    return 'Unable to load issues.';
  }
};

export default function IssueList({ baseUrl, onViewDetails, onOpenCreateModal }) {
  const [issues, setIssues] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        pageNumber: String(pageNumber),
        pageSize: String(PAGE_SIZE),
        sortDescending: 'true',
      });
      if (appliedSearch) params.set('searchTerm', appliedSearch);

      const response = await fetch(`${baseUrl}/api/staff/issues?${params}`);
      if (!response.ok) throw new Error(await readProblemDetail(response));
      const data = await response.json();
      setIssues(data.items || []);
      setTotalCount(data.totalCount || 0);
    } catch (fetchError) {
      setIssues([]);
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, baseUrl, pageNumber]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
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
            placeholder="Search issues by ID, title, description, or stall"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <button type="submit" className="btn-secondary">Search</button>
          {appliedSearch ? (
            <button type="button" className="btn-filter-clear" onClick={() => { setSearchQuery(''); setAppliedSearch(''); setPageNumber(1); }}>Clear</button>
          ) : null}
        </form>
        <button type="button" className="btn-primary" onClick={onOpenCreateModal}>+ Report New Issue</button>
      </div>

      {loading ? <div className="loading-state">Loading issues...</div> : null}
      {!loading && error ? <div className="error-state"><p className="error-message">{error}</p><button className="btn-secondary" onClick={fetchIssues}>Retry</button></div> : null}
      {!loading && !error && issues.length === 0 ? <div className="empty-state"><p>No issues found.</p></div> : null}
      {!loading && !error && issues.length > 0 ? (
        <>
          <div className="table-card">
            <div className="table-card-header"><span className="table-card-title">Issues</span><span className="table-count-badge">{totalCount} issues</span></div>
            <div className="table-responsive">
              <table className="staff-table">
                <thead><tr><th>ID</th><th>Issue</th><th>Location</th><th>Status</th><th>Reported</th><th>Action</th></tr></thead>
                <tbody>
                  {issues.map((issue) => (
                    <tr key={issue.issueId}>
                      <td><strong>#{issue.issueId}</strong></td>
                      <td>{issue.title}</td>
                      <td><span className="badge-stall">{issue.stallCode || 'Unknown stall'}</span></td>
                      <td><span className={`status-badge ${issue.status?.toLowerCase() || 'reported'}`}>{issue.status || 'Reported'}</span></td>
                      <td>{issue.createdAt ? new Date(issue.createdAt).toLocaleDateString('en-US') : 'N/A'}</td>
                      <td><button type="button" className="btn-link" onClick={() => onViewDetails(issue.issueId)}>View Details</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 ? (
            <div className="pagination-wrapper">
              <span className="pagination-info">Page {pageNumber} of {totalPages}</span>
              <div className="pagination-buttons">
                <button className="btn-page" onClick={() => setPageNumber((page) => Math.max(1, page - 1))} disabled={pageNumber === 1}>Prev</button>
                <button className="btn-page" onClick={() => setPageNumber((page) => Math.min(totalPages, page + 1))} disabled={pageNumber === totalPages}>Next</button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
