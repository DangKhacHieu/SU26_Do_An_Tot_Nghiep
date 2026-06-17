import React, { useState, useEffect } from 'react';
import './TaskListManager.css';
import CreateTaskModal from './CreateTaskModal';
import AssignStaffModal from './AssignStaffModal';
import UpdateTaskStatusModal from './UpdateTaskStatusModal';

/* ── Inline Icons ── */
const IconSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEye = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconUser = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconEditStatus = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const IconEmpty = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>;

export default function TaskListManager({ userId, baseUrl, navigate, addToast }) {
  // Filtering & Pagination State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState(null);
  const [selectedTaskForStatus, setSelectedTaskForStatus] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch tasks when parameters change
  useEffect(() => {
    fetchTasks();
  }, [baseUrl, debouncedSearchQuery, typeFilter, statusFilter, pageNumber]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = `${baseUrl}/api/manager/tasks?PageNumber=${pageNumber}&PageSize=10`;
      if (debouncedSearchQuery) url += `&Search=${encodeURIComponent(debouncedSearchQuery)}`;
      if (typeFilter) url += `&TaskType=${encodeURIComponent(typeFilter)}`;
      if (statusFilter) url += `&Status=${encodeURIComponent(statusFilter)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Support both backend PagedResult schema casings
        const items = data.items || data.Items || [];
        const pages = data.totalPages || data.TotalPages || 1;
        const count = data.totalCount || data.TotalCount || 0;

        setTasks(items);
        setTotalPages(pages);
        setTotalCount(count);
      } else {
        addToast('Failed to load tasks list.', 'error');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      addToast('Network error loading tasks.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setStatusFilter('');
    setPageNumber(1);
  };

  const formatTaskType = (type) => {
    if (type === 'UtilityReading') return 'Utility Reading';
    if (type === 'CashCollection') return 'Cash Collection';
    return type;
  };

  const formatStatus = (status) => {
    if (status === 'PendingApproval') return 'Pending Approval';
    if (status === 'In_Progress') return 'In Progress';
    return status;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  return (
    <div className="task-manager-container">
      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-wrap">
            <IconSearch />
            <input
              type="text"
              className="search-input"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPageNumber(1);
              }}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>&times;</button>
            )}
          </div>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPageNumber(1);
            }}
          >
            <option value="">All Types</option>
            <option value="Repair">Repair</option>
            <option value="Maintenance">Maintenance</option>
            <option value="UtilityReading">Utility Reading</option>
            <option value="CashCollection">Cash Collection</option>
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPageNumber(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="PendingApproval">Pending Approval</option>
            <option value="In_Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {(searchQuery || typeFilter || statusFilter) && (
            <button className="btn-filter-clear" onClick={handleClearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <IconPlus /> CREATE TASK
        </button>
      </div>

      {/* ── Table Card ── */}
      <div className="table-card">
        <div className="table-card-header">
          <span className="table-card-title">Task Overview</span>
          <span className="table-count-badge">{totalCount} Tasks</span>
        </div>

        <div className="table-responsive">
          {loading ? (
            <div className="state-empty">
              <div className="spinner"></div>
              <p className="state-empty-text">Loading operational tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="state-empty">
              <IconEmpty />
              <p className="state-empty-text">No tasks found matching current filters.</p>
            </div>
          ) : (
            <table className="cat-table">
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>ID</th>
                  <th>Task Label</th>
                  <th>Task Type</th>
                  <th>Created At</th>
                  <th>Status</th>
                  <th>Assigned Staff</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  return (
                    <tr 
                      key={task.taskId} 
                      className="task-row-clickable"
                      onClick={() => navigate('task-details', task.taskId)}
                    >
                      <td className="row-no">#{task.taskId}</td>
                      <td>
                        <div className="task-title-cell">
                          <span className="task-title-text">{task.title}</span>
                          {task.description && (
                            <span className="task-desc-hint">{task.description}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="task-type-badge">
                          {formatTaskType(task.taskType)}
                        </span>
                        {task.areaName && (
                          <span className="task-area-badge">
                            Area: {task.areaName}
                          </span>
                        )}
                      </td>
                      <td>{formatDate(task.createdAt)}</td>
                      <td>
                        <span className={`badge-status status-${task.status.toLowerCase()}`}>
                          <span className="badge-dot"></span>
                          {formatStatus(task.status)}
                        </span>
                      </td>
                      <td>
                        <div className="staff-assignee-cell">
                          <span className="staff-name-text">{task.assignedToName}</span>
                        </div>
                      </td>
                      <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="btn-icon edit" 
                          title="View Details"
                          onClick={() => navigate('task-details', task.taskId)}
                        >
                          <IconEye />
                        </button>
                        
                        {/* Assign staff is available for non-completed / non-cancelled tasks */}
                        {task.status !== 'Completed' && task.status !== 'Cancelled' && (
                          <button 
                            className="btn-icon edit" 
                            title="Reassign Staff"
                            onClick={() => setSelectedTaskForAssign(task)}
                          >
                            <IconUser />
                          </button>
                        )}

                        {/* Status updates is available for valid transitions */}
                        {task.status !== 'Completed' && task.status !== 'Cancelled' && (
                          <button 
                            className="btn-icon edit" 
                            title="Update Status"
                            onClick={() => setSelectedTaskForStatus(task)}
                          >
                            <IconEditStatus />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="pagination-footer">
            <button 
              className="btn-secondary btn-pagination" 
              disabled={pageNumber === 1}
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="pagination-text">
              Page {pageNumber} of {totalPages}
            </span>
            <button 
              className="btn-secondary btn-pagination" 
              disabled={pageNumber === totalPages}
              onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreateModal && (
        <CreateTaskModal
          userId={userId}
          baseUrl={baseUrl}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTasks();
          }}
          addToast={addToast}
        />
      )}

      {selectedTaskForAssign && (
        <AssignStaffModal
          taskId={selectedTaskForAssign.taskId}
          currentStaffId={selectedTaskForAssign.assignedToUserId}
          baseUrl={baseUrl}
          onClose={() => setSelectedTaskForAssign(null)}
          onSuccess={() => {
            setSelectedTaskForAssign(null);
            fetchTasks();
          }}
          addToast={addToast}
        />
      )}

      {selectedTaskForStatus && (
        <UpdateTaskStatusModal
          taskId={selectedTaskForStatus.taskId}
          currentStatus={selectedTaskForStatus.status}
          baseUrl={baseUrl}
          onClose={() => setSelectedTaskForStatus(null)}
          onSuccess={() => {
            setSelectedTaskForStatus(null);
            fetchTasks();
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}
