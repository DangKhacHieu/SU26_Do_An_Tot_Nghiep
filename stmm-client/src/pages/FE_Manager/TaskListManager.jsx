import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import './TaskListManager.css';
import CreateTaskModal from './CreateTaskModal';

/* ── Inline Icons ── */
const IconSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEye = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEmpty = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>;

const PAGE_SIZE = 10;

export default function TaskListManager({ baseUrl, navigate, addToast }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US';

  // Filtering & Pagination State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pageNumber, setPageNumber] = useState(1);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/manager/tasks`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      addToast(t('tasklistmanager.network_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, baseUrl, t]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = debouncedSearchQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch = !normalizedSearch
        || [task.title, task.description]
          .some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
      const matchesType = !typeFilter || task.taskType === typeFilter;
      const matchesStatus = !statusFilter || task.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [debouncedSearchQuery, statusFilter, tasks, typeFilter]);

  const totalCount = filteredTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePageNumber = Math.min(pageNumber, totalPages);
  const visibleTasks = useMemo(() => {
    const startIndex = (safePageNumber - 1) * PAGE_SIZE;
    return filteredTasks.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredTasks, safePageNumber]);

  useEffect(() => {
    if (pageNumber !== safePageNumber) setPageNumber(safePageNumber);
  }, [pageNumber, safePageNumber]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setStatusFilter('');
    setPageNumber(1);
  };

  const formatTaskType = (type) => {
    if (type === 'UtilityReading') return t('tasklistmanager.utility_reading');
    if (type === 'Repair') return t('tasklistmanager.repair');
    if (type === 'Maintenance') return t('tasklistmanager.maintenance');
    return type;
  };

  const formatStatus = (status) => {
    if (status === 'PendingApproval') return t('tasklistmanager.pending_approval');
    if (status === 'In_Progress') return t('tasklistmanager.in_progress');
    if (status === 'Pending') return t('tasklistmanager.pending');
    if (status === 'Completed') return t('tasklistmanager.completed');
    if (status === 'Cancelled') return t('tasklistmanager.cancelled');
    return status;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, {
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
    document.title = t('tasklistmanager.stmm_task_list_management');

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute("content") : "";

    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", t('tasklistmanager.page_for_managing_assigning'));

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
  }, [t]);

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
              placeholder={t('tasklistmanager.search_placeholder')}
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
            <option value="">{t('tasklistmanager.all_types')}</option>
            <option value="Repair">{t('tasklistmanager.repair')}</option>
            <option value="Maintenance">{t('tasklistmanager.maintenance')}</option>
            <option value="UtilityReading">{t('tasklistmanager.utility_reading')}</option>
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
            <option value="">{t('tasklistmanager.all_statuses')}</option>
            <option value="Pending">{t('tasklistmanager.pending')}</option>
            <option value="PendingApproval">{t('tasklistmanager.pending_approval')}</option>
            <option value="In_Progress">{t('tasklistmanager.in_progress')}</option>
            <option value="Completed">{t('tasklistmanager.completed')}</option>
            <option value="Cancelled">{t('tasklistmanager.cancelled')}</option>
          </select>

          {(searchQuery || typeFilter || statusFilter) && (
            <button 
              id="btn-manager-task-reset-filters"
              className="btn-filter-clear" 
              onClick={handleClearFilters}
            >
              {t('tasklistmanager.clear_filters')}
            </button>
          )}
        </div>

        <div className="toolbar-actions">
          <button 
            id="btn-manager-create-task"
            className="task-btn task-btn-primary" 
            onClick={() => setShowCreateModal(true)}
          >
            <IconPlus /> {t('tasklistmanager.create_task')}
          </button>
        </div>
      </section>

      {/* ── Table Card ── */}
      <section className="table-section" id="task-manager-table-section">
        <div className="task-table-card">
          <div className="task-table-card-header">
            <span className="task-table-card-title">{t('tasklistmanager.overview')}</span>
            <span className="task-table-count-badge">{totalCount} {t('tasklistmanager.tasks_count')}</span>
          </div>

          <div className="task-table-responsive">
            {loading ? (
              <div className="task-state-empty">
                <div className="task-spinner"></div>
                <p className="task-state-empty-text">{t('tasklistmanager.loading')}</p>
              </div>
            ) : visibleTasks.length === 0 ? (
              <div className="task-state-empty">
                <IconEmpty />
                <p className="task-state-empty-text">{t('tasklistmanager.empty')}</p>
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
                    <th className="task-th-id">{t('tasklistmanager.id')}</th>
                    <th>{t('tasklistmanager.label')}</th>
                    <th>{t('tasklistmanager.type')}</th>
                    <th>{t('tasklistmanager.created_at')}</th>
                    <th>{t('tasklistmanager.status')}</th>
                    <th>{t('tasklistmanager.assigned_staff')}</th>
                    <th className="task-th-actions">{t('tasklistmanager.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTasks.map((task) => {
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
                              {t('tasklistmanager.area')}: {task.areaName}
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
                            title={t('tasklistmanager.view_details')}
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
                disabled={safePageNumber === 1}
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              >
                {t('tasklistmanager.previous')}
              </button>
              <span className="task-pagination-text">
                {t('tasklistmanager.page_of', { page: safePageNumber, total: totalPages })}
              </span>
              <button 
                id="btn-manager-page-next"
                className="task-btn task-btn-secondary task-btn-pagination" 
                disabled={safePageNumber === totalPages}
                onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
              >
                {t('tasklistmanager.next')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Modals ── */}
      {showCreateModal && (
        <CreateTaskModal
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
