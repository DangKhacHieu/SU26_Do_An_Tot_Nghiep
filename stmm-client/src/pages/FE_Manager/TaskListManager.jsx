import { useState, useEffect } from 'react';
import './TaskListManager.css';
import CreateTaskModal from './CreateTaskModal';

/* ── Inline Icons ── */
const IconSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEye = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
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



  // SEO & metadata management
  useEffect(() => {
    const originalTitle = document.title;
    document.title = "STMM - Quản lý Danh sách Tác vụ";

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute("content") : "";

    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", "Trang quản lý, phân công và giám sát các tác vụ vận hành của ban quản lý STMM.");

    return () => {
      document.title = originalTitle;
      if (metaDesc) {
        if (originalDesc) {
          metaDesc.setAttribute("content", originalDesc);
        } else {
          metaDesc.remove();
        }
      }
    };
  }, []);

  return (
    <main className="task-manager-container" id="task-manager-main-view">

      {/* ── Toolbar ── */}
      <section className="toolbar-section" id="task-manager-toolbar-section">
        <div className="toolbar-left">
          <div className="search-wrap">
            <IconSearch />
            <input
              type="text"
              id="input-manager-task-search"
              className="search-input"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPageNumber(1);
              }}
            />
            {searchQuery && (
              <button 
                id="btn-manager-task-search-clear"
                className="search-clear" 
                onClick={() => setSearchQuery('')}
              >
                &times;
              </button>
            )}
          </div>

          <select
            id="select-manager-task-type"
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
            id="select-manager-task-status"
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
            <button 
              id="btn-manager-task-reset-filters"
              className="btn-filter-clear" 
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="toolbar-actions">
          <button 
            id="btn-manager-create-task"
            className="task-btn task-btn-primary" 
            onClick={() => setShowCreateModal(true)}
          >
            <IconPlus /> CREATE TASK
          </button>
        </div>
      </section>

      {/* ── Table Card ── */}
      <section className="table-section" id="task-manager-table-section">
        <div className="task-table-card">
          <div className="task-table-card-header">
            <span className="task-table-card-title">Task Overview</span>
            <span className="task-table-count-badge">{totalCount} Tasks</span>
          </div>

          <div className="task-table-responsive">
            {loading ? (
              <div className="task-state-empty">
                <div className="task-spinner"></div>
                <p className="task-state-empty-text">Loading operational tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="task-state-empty">
                <IconEmpty />
                <p className="task-state-empty-text">No tasks found matching current filters.</p>
              </div>
            ) : (
              <table className="task-overview-table">
                <colgroup>
                  <col className="task-col-id" />
                  <col className="task-col-label" />
                  <col className="task-col-type" />
                  <col className="task-col-created" />
                  <col className="task-col-status" />
                  <col className="task-col-staff" />
                  <col className="task-col-actions" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="task-th-id">ID</th>
                    <th>Task Label</th>
                    <th>Task Type</th>
                    <th>Created At</th>
                    <th>Status</th>
                    <th>Assigned Staff</th>
                    <th className="task-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    return (
                      <tr 
                        key={task.taskId} 
                        id={`tr-manager-task-${task.taskId}`}
                        className="task-row-clickable"
                        onClick={() => navigate('task-details', task.taskId)}
                      >
                        <td className="task-row-no">#{task.taskId}</td>
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
                        <td className="task-date-cell">{formatDate(task.createdAt)}</td>
                        <td>
                          <span className={`task-status-badge status-${task.status.toLowerCase()}`}>
                            <span className="task-status-dot"></span>
                            {formatStatus(task.status)}
                          </span>
                        </td>
                        <td>
                          <div className="task-staff-assignee-cell">
                            <span className="task-staff-name-text">{task.assignedToName}</span>
                          </div>
                        </td>
                        <td className="task-actions-cell" onClick={(e) => e.stopPropagation()}>
                          <button 
                            id={`btn-manager-view-details-${task.taskId}`}
                            className="task-action-btn" 
                            title="View Details"
                            onClick={() => navigate('task-details', task.taskId)}
                          >
                            <IconEye />
                          </button>
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
            <div className="task-pagination-footer">
              <button 
                id="btn-manager-page-prev"
                className="task-btn task-btn-secondary task-btn-pagination" 
                disabled={pageNumber === 1}
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="task-pagination-text">
                Page {pageNumber} of {totalPages}
              </span>
              <button 
                id="btn-manager-page-next"
                className="task-btn task-btn-secondary task-btn-pagination" 
                disabled={pageNumber === totalPages}
                onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

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
    </main>
  );
}
