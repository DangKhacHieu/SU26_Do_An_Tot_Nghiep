import { useCallback, useEffect, useState } from 'react';
import './ViolationList.css';

const PAGE_SIZE = 8;

const readProblemDetail = async (response) => {
  try {
    const problem = await response.json();
    return problem.detail || problem.title || 'Unable to load violations.';
  } catch {
    return 'Unable to load violations.';
  }
};

export default function ViolationList({ baseUrl, onViewDetails, onOpenCreateModal }) {
  const [violations, setViolations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchViolations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        pageNumber: String(pageNumber),
        pageSize: String(PAGE_SIZE),
        sortDescending: 'true',
      });
      if (appliedSearch) params.set('searchTerm', appliedSearch);

      const response = await fetch(`${baseUrl}/api/violations?${params}`);
      if (!response.ok) throw new Error(await readProblemDetail(response));
      const data = await response.json();
      setViolations(data.items || []);
      setTotalCount(data.totalCount || 0);
    } catch (fetchError) {
      setViolations([]);
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, baseUrl, pageNumber]);

  useEffect(() => { fetchViolations(); }, [fetchViolations]);

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
          <input type="search" className="search-input" placeholder="Search violations by ID, title, description, or stall" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
          <button type="submit" className="btn-secondary">Search</button>
          {appliedSearch ? <button type="button" className="btn-filter-clear" onClick={() => { setSearchQuery(''); setAppliedSearch(''); setPageNumber(1); }}>Clear</button> : null}
        </form>
        <button type="button" className="btn-primary" onClick={onOpenCreateModal}>+ Report Violation</button>
      </div>

      {loading ? <div className="loading-state">Loading violations...</div> : null}
      {!loading && error ? <div className="error-state"><p className="error-message">{error}</p><button className="btn-secondary" onClick={fetchViolations}>Retry</button></div> : null}
      {!loading && !error && violations.length === 0 ? <div className="empty-state"><p>No violations found.</p></div> : null}
      {!loading && !error && violations.length > 0 ? (
        <>
          <div className="table-card">
            <div className="table-card-header"><span className="table-card-title">Violations</span><span className="table-count-badge">{totalCount} violations</span></div>
            <div className="table-responsive">
              <table className="staff-table">
                <thead><tr><th>ID</th><th>Violation</th><th>Location</th><th>Fine</th><th>Status</th><th>Reported</th><th>Action</th></tr></thead>
                <tbody>
                  {violations.map((violation) => (
                    <tr key={violation.violationId}>
                      <td><strong>#{violation.violationId}</strong></td>
                      <td>{violation.title}</td>
                      <td><span className="badge-stall">{violation.stallCode || 'Unknown stall'}</span></td>
                      <td>{Number(violation.fineAmount || 0).toLocaleString('en-US')} VND</td>
                      <td><span className={`status-badge ${violation.status?.toLowerCase() || 'pending'}`}>{violation.status || 'Pending'}</span></td>
                      <td>{violation.createdAt ? new Date(violation.createdAt).toLocaleDateString('en-US') : 'N/A'}</td>
                      <td><button type="button" className="btn-link" onClick={() => onViewDetails(violation.violationId)}>View Details</button></td>
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
