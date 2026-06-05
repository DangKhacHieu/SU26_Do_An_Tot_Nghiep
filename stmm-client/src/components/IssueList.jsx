import React, { useState, useEffect } from 'react';

export default function IssueList({ userId, baseUrl, onViewDetails, onOpenCreateModal }) {
  const [issues, setIssues] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Query parameters state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(5);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDescending, setSortDescending] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build API query string
      let url = `${baseUrl}/api/staff/issues?userId=${userId}&pageNumber=${pageNumber}&pageSize=${pageSize}&sortDescending=${sortDescending}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch issues: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Filter client-side if searchQuery is provided (since backend doesn't have search text filtering built-in for GetIssues)
      let items = data.items || [];
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        items = items.filter(v => 
          v.issueId.toString().includes(query) ||
          (v.stallCode && v.stallCode.toLowerCase().includes(query)) ||
          (v.title && v.title.toLowerCase().includes(query)) ||
          (v.description && v.description.toLowerCase().includes(query))
        );
      }
      
      setIssues(items);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [userId, pageNumber, statusFilter, sortDescending]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIssues();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPageNumber(1);
    setSortDescending(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="violation-list-container">
      <div className="breadcrumb-path">
        <span>Dashboard</span> &gt; <span className="active-path">Issues</span>
      </div>

      <div className="section-header">
        <div>
          <h1 className="main-title">Issue List</h1>
          <p className="subtitle">Manage and track reported facility issues.</p>
        </div>
        <button className="btn-primary report-btn" onClick={onOpenCreateModal}>
          + Report New Issue
        </button>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="filters-wrapper">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search ID, Stall Code, or Description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-input"
          />
        </div>
        
        <div className="filter-group">
          <label className="filter-label">Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPageNumber(1); }}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="InProgress">InProgress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Sort:</label>
          <select 
            value={sortDescending ? "desc" : "asc"} 
            onChange={(e) => { setSortDescending(e.target.value === "desc"); setPageNumber(1); }}
            className="filter-select"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

        <button type="submit" className="btn-secondary">Search</button>
        <button type="button" className="btn-secondary-outline" onClick={handleResetFilters}>
          Clear
        </button>
      </form>

      {/* Content Table */}
      {loading ? (
        <div className="loading-state">Loading issues...</div>
      ) : error ? (
        <div className="error-state">
          <p className="error-message">Error: {error}</p>
          <button className="btn-secondary" onClick={fetchIssues}>Retry</button>
        </div>
      ) : issues.length === 0 ? (
        <div className="empty-state">
          <p>No issues found.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="violation-table issue-table">
              <thead>
                <tr>
                  <th>Issue ID</th>
                  <th>Issue Title</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Reported By</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((item) => (
                  <tr key={item.issueId}>
                    <td><strong>ISS-{item.issueId}</strong></td>
                    <td>{item.title}</td>
                    <td><span className="badge-stall">{item.stallCode || `ID: ${item.stallId}`}</span></td>
                    <td>
                      <span className={`status-badge ${item.status?.toLowerCase() || 'reported'}`}>
                        {item.status || 'Reported'}
                      </span>
                    </td>
                    <td>{item.createdByName || `Staff #${item.createdByUserId}`}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <button 
                        className="btn-link" 
                        onClick={() => onViewDetails(item.issueId)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="pagination-wrapper">
            <span className="pagination-info">
              Showing 1 to {issues.length} of {totalCount} entries
            </span>
            <div className="pagination-buttons">
              <button 
                className="btn-page" 
                onClick={() => setPageNumber(p => Math.max(p - 1, 1))}
                disabled={pageNumber === 1}
              >
                Prev
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
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
