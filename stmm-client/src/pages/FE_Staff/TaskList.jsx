import React, { useState, useEffect } from 'react';
import { TASK_STATUS, TASK_TYPE } from '../../constants/taskEnums';
import './TaskList.css';

export default function TaskList({ userId, baseUrl, onViewDetails }) {
  const [tasks, setTasks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter & Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build API query string
      let url = `${baseUrl}/api/staff/tasks?userId=${userId}&pageNumber=${pageNumber}&pageSize=${pageSize}`;
      if (statusFilter) {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }
      if (typeFilter) {
        url += `&taskType=${encodeURIComponent(typeFilter)}`;
      }
      if (appliedSearch.trim() !== '') {
        url += `&search=${encodeURIComponent(appliedSearch.trim())}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }
      const data = await response.json();

      setTasks(data.items || []);
      setTotalCount(data.totalCount || 0);
      
      // Calculate total pages safely
      const calculatedTotalPages = data.totalPages || Math.ceil((data.totalCount || 0) / pageSize) || 1;
      setTotalPages(calculatedTotalPages);
    } catch (err) {
      console.error('Error loading staff tasks:', err);
      setError(err.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [userId, pageNumber, statusFilter, typeFilter, appliedSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPageNumber(1);
    setAppliedSearch(searchQuery);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setPageNumber(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper to style badge based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case TASK_STATUS.PENDING: return 'badge-pending';
      case TASK_STATUS.PENDING_APPROVAL: return 'badge-approval';
      case TASK_STATUS.IN_PROGRESS: return 'badge-progress';
      case TASK_STATUS.COMPLETED: return 'badge-completed';
      case TASK_STATUS.CANCELLED: return 'badge-cancelled';
      default: return 'badge-default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case TASK_STATUS.PENDING: return 'Pending';
      case TASK_STATUS.PENDING_APPROVAL: return 'Pending Quote Approval';
      case TASK_STATUS.IN_PROGRESS: return 'In Progress';
      case TASK_STATUS.COMPLETED: return 'Completed';
      case TASK_STATUS.CANCELLED: return 'Cancelled';
      default: return status;
    }
  };

  // Helper to style badge based on type
  const getTypeBadgeClass = (type) => {
    switch (type) {
      case TASK_TYPE.REPAIR: return 'badge-repair';
      case TASK_TYPE.MAINTENANCE: return 'badge-maintenance';
      case TASK_TYPE.UTILITY_READING: return 'badge-utility';
      case TASK_TYPE.CASH_COLLECTION: return 'badge-cash';
      default: return 'badge-default';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case TASK_TYPE.REPAIR: return 'Repair';
      case TASK_TYPE.MAINTENANCE: return 'Maintenance';
      case TASK_TYPE.UTILITY_READING: return 'Meter Reading';
      case TASK_TYPE.CASH_COLLECTION: return 'Cash Collection';
      default: return type;
    }
  };

  return (
    <div className="task-list-container">

      {/* Toolbar: Search + Filters + CTA */}
      <div className="toolbar">
        <div className="toolbar-left">
          <form onSubmit={handleSearchSubmit} className="search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="search-clear" onClick={() => { setSearchQuery(''); setAppliedSearch(''); }} title="Clear">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </button>
            )}
          </form>

          <select 
            value={typeFilter} 
            onChange={(e) => { setTypeFilter(e.target.value); setPageNumber(1); }}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value={TASK_TYPE.REPAIR}>Repair</option>
            <option value={TASK_TYPE.MAINTENANCE}>Maintenance</option>
            <option value={TASK_TYPE.UTILITY_READING}>Meter Reading</option>
            <option value={TASK_TYPE.CASH_COLLECTION}>Cash Collection</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPageNumber(1); }}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value={TASK_STATUS.PENDING}>Pending</option>
            <option value={TASK_STATUS.PENDING_APPROVAL}>Pending Quote Approval</option>
            <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
            <option value={TASK_STATUS.COMPLETED}>Completed</option>
            <option value={TASK_STATUS.CANCELLED}>Cancelled</option>
          </select>

          {(searchQuery || typeFilter || statusFilter) && (
            <button type="button" className="btn-filter-clear" onClick={handleResetFilters}>
              Clear Filters
            </button>
          )}
        </div>

        <button 
          className="btn-secondary map-view-btn"
          disabled 
          title="Map view feature will be available in the next release"
          style={{ cursor: 'not-allowed', opacity: 0.6 }}
        >
          📍 MAP VIEW
        </button>
      </div>

      {/* Main Table card */}
      {loading ? (
        <div className="loading-state">
          <span className="spinner"></span> Loading daily tasks...
        </div>
      ) : error ? (
        <div className="error-state">
          <p className="error-message">⚠️ Error: {error}</p>
          <button onClick={fetchTasks} className="btn-secondary">Retry</button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <h3>No Tasks Found</h3>
          <p>You currently have no tasks assigned or matching the selected filters.</p>
        </div>
      ) : (
        <>
          <div className="table-card">
            <div className="table-card-header">
              <span className="table-card-title">Daily Tasks</span>
              <span className="table-count-badge">{totalCount} tasks</span>
            </div>
            <div className="table-responsive">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Task Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Completed Date</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.taskId}>
                      <td className="task-id-cell">{task.taskId}</td>
                      <td className="task-title-td">
                        <div className="task-title-text" title={task.title}>{task.title}</div>
                        {task.areaName && <span className="task-area-tag">📍 {task.areaName}</span>}
                      </td>
                      <td>
                        <span className={`type-badge ${getTypeBadgeClass(task.taskType)}`}>
                          {getTypeLabel(task.taskType)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                      </td>
                      <td className="task-date-cell">{formatDate(task.createdAt)}</td>
                      <td className="task-date-cell">{formatDate(task.completedAt)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => onViewDetails(task.taskId)} 
                          className="btn-action-detail"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <span className="pagination-info">
                Showing {((pageNumber - 1) * pageSize) + 1} - {Math.min(pageNumber * pageSize, totalCount)} of {totalCount} entries
              </span>
              <div className="pagination-buttons">
                <button
                  disabled={pageNumber === 1}
                  onClick={() => setPageNumber(1)}
                  className="page-btn"
                  title="First Page"
                >
                  &laquo;
                </button>
                <button
                  disabled={pageNumber === 1}
                  onClick={() => setPageNumber(prev => prev - 1)}
                  className="page-btn"
                  title="Previous Page"
                >
                  &lsaquo;
                </button>
                <span className="page-number-current">
                  Page {pageNumber} of {totalPages}
                </span>
                <button
                  disabled={pageNumber === totalPages}
                  onClick={() => setPageNumber(prev => prev + 1)}
                  className="page-btn"
                  title="Next Page"
                >
                  &rsaquo;
                </button>
                <button
                  disabled={pageNumber === totalPages}
                  onClick={() => setPageNumber(totalPages)}
                  className="page-btn"
                  title="Last Page"
                >
                  &raquo;
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
