import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  MapPin,
  Map,
  Search,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';
import { TASK_STATUS, TASK_TYPE } from '../../constants/taskEnums';
import { TASK_STATUS_TONE } from '../../constants/enumMaps';
import './TaskList.css';

const PAGE_SIZE = 6;
const FINISHED_STATUSES = new Set([TASK_STATUS.COMPLETED, TASK_STATUS.CANCELLED]);

const readProblemDetail = async (response, t) => {
  try {
    const payload = await response.json();
    return payload.detail || payload.title || t('tasklist.unable_to_load_assigned');
  } catch {
    return t('tasklist.unable_to_load_assigned');
  }
};

const formatDate = (value, t, lng) => {
  if (!value) return t('tasklist.date_not_available');
  const locale = lng?.startsWith('vi') ? 'vi-VN' : 'en-US';
  return new Date(value).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function TaskList({ baseUrl, onViewDetails, onMapView }) {
  const { t, i18n } = useTranslation();

  const STATUS_LABELS = useMemo(() => ({
    [TASK_STATUS.PENDING]: t('tasklist.pending'),
    [TASK_STATUS.PENDING_APPROVAL]: t('tasklist.pending_approval'),
    [TASK_STATUS.IN_PROGRESS]: t('tasklist.in_progress'),
    [TASK_STATUS.COMPLETED]: t('tasklist.completed'),
    [TASK_STATUS.CANCELLED]: t('tasklist.cancelled'),
  }), [t]);

  const TYPE_LABELS = useMemo(() => ({
    [TASK_TYPE.REPAIR]: t('tasklist.repair'),
    [TASK_TYPE.UTILITY_READING]: t('tasklist.utility_reading'),
  }), [t]);

  // tone là CSS class modifier — KHÔNG dùng t(), dùng static token từ TASK_STATUS_TONE
  const STAT_CARDS = useMemo(() => [
    { status: TASK_STATUS.PENDING,          label: t('tasklist.pending'),          icon: Clock3,       tone: TASK_STATUS_TONE.Pending         },
    { status: TASK_STATUS.PENDING_APPROVAL, label: t('tasklist.pending_approval'), icon: ShieldCheck,  tone: TASK_STATUS_TONE.PendingApproval },
    { status: TASK_STATUS.IN_PROGRESS,      label: t('tasklist.in_progress'),      icon: Wrench,       tone: TASK_STATUS_TONE.In_Progress     },
    { status: TASK_STATUS.COMPLETED,        label: t('tasklist.completed'),        icon: CheckCircle2, tone: TASK_STATUS_TONE.Completed       },
  ], [t]);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageNumber, setPageNumber] = useState(1);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/api/staff/tasks`, { headers: getAuthHeaders() });
      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t));
      }

      const payload = await response.json();
      setTasks(Array.isArray(payload) ? payload : []);
    } catch (fetchError) {
      console.error(t('tasklist.error_loading_staff_tasks'), fetchError);
      setError(fetchError.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, t]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const stats = useMemo(() => {
    const counts = Object.fromEntries(STAT_CARDS.map(({ status }) => [status, 0]));
    for (const task of tasks) {
      if (Object.hasOwn(counts, task.status)) counts[task.status] += 1;
    }
    return counts;
  }, [tasks, STAT_CARDS]);

  const filteredTasks = useMemo(() => {
    const term = searchQuery.trim().toLocaleLowerCase();
    const matchingTasks = term
      ? tasks.filter((task) => [
          task.taskId,
          task.title,
          task.stallCode,
          task.areaName,
          task.taskType,
          task.status,
          STATUS_LABELS[task.status] || task.status,
        ].some((value) => String(value ?? '').toLocaleLowerCase().includes(term)))
      : tasks;

    const statusTasks = statusFilter === 'all'
      ? matchingTasks
      : matchingTasks.filter((task) => task.status === statusFilter);

    return [...statusTasks].sort((left, right) => {
      const finishedDifference = Number(FINISHED_STATUSES.has(left.status)) - Number(FINISHED_STATUSES.has(right.status));
      if (finishedDifference !== 0) return finishedDifference;
      return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
    });
  }, [searchQuery, statusFilter, tasks, STATUS_LABELS]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const safePageNumber = Math.min(pageNumber, totalPages);
  const visibleTasks = filteredTasks.slice((safePageNumber - 1) * PAGE_SIZE, safePageNumber * PAGE_SIZE);

  useEffect(() => {
    if (pageNumber > totalPages) setPageNumber(totalPages);
  }, [pageNumber, totalPages]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPageNumber(1);
  };

  return (
    <main className="staff-task-list">
      <header className="staff-task-list__header">
        <div>
          <p className="staff-task-list__eyebrow">{t('tasklist.field_operations')}</p>
          <h1>{t('tasklist.assigned_tasks')}</h1>
          <p>{t('tasklist.review_and_complete_the')}</p>
        </div>
        <div className="staff-task-list__header-actions">
          <button type="button" className="staff-task-map-button" onClick={onMapView}>
            <Map size={16} aria-hidden="true" /> {t('tasklist.map_view')}</button>
          <span className="staff-task-list__total">
            <ClipboardList size={16} aria-hidden="true" />
            {tasks.length} {t('tasklist.assigned')}
          </span>
        </div>
      </header>


      <nav className="staff-data-tabs" aria-label={t('tasklist.task_statistics')}>
        <button type="button" className={statusFilter === 'all' ? 'active' : ''} onClick={() => { setStatusFilter('all'); setPageNumber(1); }}>
          {t('tasklist.all', 'All')} <span>{tasks.length}</span>
        </button>
        {STAT_CARDS.map(({ status, label }) => (
          <button type="button" key={status} className={statusFilter === status ? 'active' : ''} onClick={() => { setStatusFilter(status); setPageNumber(1); }}>
            {label} <span>{stats[status]}</span>
          </button>
        ))}
      </nav>

      <section className="staff-task-list__toolbar" aria-label={t('tasklist.search_assigned_tasks')}>
        <div className="staff-task-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t('tasklist.search_by_id_title')}
            aria-label={t('tasklist.search_assigned_tasks')}
          />
          {searchQuery ? (
            <button type="button" onClick={() => { setSearchQuery(''); setPageNumber(1); }} aria-label={t('tasklist.clear_search')}>
              <X size={17} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <span className="staff-task-list__result-count">
          {filteredTasks.length} {filteredTasks.length === 1 ? t('tasklist.result') : t('tasklist.results')}
        </span>
      </section>

      {loading ? (
        <div className="staff-task-state" role="status">
          <span className="staff-task-spinner" />
          <p>{t('tasklist.loading_assigned_tasks')}</p>
        </div>
      ) : error ? (
        <div className="staff-task-state staff-task-state--error" role="alert">
          <h2>{t('tasklist.tasks_could_not_be')}</h2>
          <p>{error}</p>
          <button type="button" onClick={fetchTasks}>{t('tasklist.try_again')}</button>
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="staff-task-state">
          <ClipboardList size={42} aria-hidden="true" />
          <h2>{tasks.length === 0 ? t('tasklist.no_assigned_tasks') : t('tasklist.no_matching_tasks')}</h2>
          <p>{tasks.length === 0 ? t('tasklist.new_work_will_appear') : t('tasklist.try_a_different_search')}</p>
        </div>
      ) : (
        <>
          <section className="staff-task-grid" aria-label={t('tasklist.assigned_task_cards')}>
            {visibleTasks.map((task) => {
              const location = task.stallCode || task.areaName || t('tasklist.location_not_specified');
              return (
                <article className="staff-task-card" key={task.taskId}>
                  <div className="staff-task-card__topline">
                    <span className="staff-task-card__id">#{task.taskId}</span>
                    <div className="staff-task-card__badges">
                      <span className={`staff-task-badge staff-task-badge--${task.taskType.toLowerCase()}`}>
                        {TYPE_LABELS[task.taskType] || task.taskType}
                      </span>
                      <span className={`staff-task-badge staff-task-badge--status-${task.status.toLowerCase()}`}>
                        {STATUS_LABELS[task.status] || task.status}
                      </span>
                    </div>
                  </div>

                  <div className="staff-task-card__body">
                    <h2>{task.title}</h2>
                    <p><MapPin size={16} aria-hidden="true" /> {location}</p>
                    <p><CalendarDays size={16} aria-hidden="true" /> {t('tasklist.assigned')} {formatDate(task.createdAt, t, i18n?.language)}</p>
                  </div>

                  <footer className="staff-task-card__footer">
                    <button type="button" onClick={() => onViewDetails(task.taskId)}>
                      {t('tasklist.view_details')}<ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </footer>
                </article>
              );
            })}
          </section>

          {totalPages > 1 ? (
            <nav className="staff-task-pagination" aria-label={t('tasklist.task_list_pagination')}>
              <span>
                {t('tasklist.showing')} {(safePageNumber - 1) * PAGE_SIZE + 1}–{Math.min(safePageNumber * PAGE_SIZE, filteredTasks.length)} {t('tasklist.of')} {filteredTasks.length}
              </span>
              <div>
                <button
                  type="button"
                  disabled={safePageNumber === 1}
                  onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
                  aria-label={t('tasklist.previous_page')}
                >
                  <ChevronLeft size={17} aria-hidden="true" />
                </button>
                <strong>{t('tasklist.page')} {safePageNumber} {t('tasklist.of')} {totalPages}</strong>
                <button
                  type="button"
                  disabled={safePageNumber === totalPages}
                  onClick={() => setPageNumber((current) => Math.min(totalPages, current + 1))}
                  aria-label={t('tasklist.next_page')}
                >
                  <ChevronRight size={17} aria-hidden="true" />
                </button>
              </div>
            </nav>
          ) : null}
        </>
      )}
    </main>
  );
}
