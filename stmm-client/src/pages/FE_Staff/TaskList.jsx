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
import './TaskList.css';

const PAGE_SIZE = 9;
const FINISHED_STATUSES = new Set([TASK_STATUS.COMPLETED, TASK_STATUS.CANCELLED]);

const STATUS_LABELS = {
  [TASK_STATUS.PENDING]: 'Pending',
  [TASK_STATUS.PENDING_APPROVAL]: 'Pending Approval',
  [TASK_STATUS.IN_PROGRESS]: 'In Progress',
  [TASK_STATUS.COMPLETED]: 'Completed',
  [TASK_STATUS.CANCELLED]: 'Cancelled',
};

const TYPE_LABELS = {
  [TASK_TYPE.REPAIR]: 'Repair',
  [TASK_TYPE.MAINTENANCE]: 'Maintenance',
  [TASK_TYPE.UTILITY_READING]: 'Utility Reading',
};

const STAT_CARDS = [
  { status: TASK_STATUS.PENDING, label: 'Pending', icon: Clock3, tone: 'warning' },
  { status: TASK_STATUS.PENDING_APPROVAL, label: 'Pending Approval', icon: ShieldCheck, tone: 'approval' },
  { status: TASK_STATUS.IN_PROGRESS, label: 'In Progress', icon: Wrench, tone: 'progress' },
  { status: TASK_STATUS.COMPLETED, label: 'Completed', icon: CheckCircle2, tone: 'success' },
];

const readProblemDetail = async (response) => {
  try {
    const payload = await response.json();
    return payload.detail || payload.title || 'Unable to load assigned tasks.';
  } catch {
    return 'Unable to load assigned tasks.';
  }
};

const formatDate = (value) => {
  if (!value) return 'Date not available';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function TaskList({ baseUrl, onViewDetails, onMapView }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageNumber, setPageNumber] = useState(1);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/api/staff/tasks`, { headers: getAuthHeaders() });
      if (!response.ok) {
        throw new Error(await readProblemDetail(response));
      }

      const payload = await response.json();
      setTasks(Array.isArray(payload) ? payload : []);
    } catch (fetchError) {
      console.error('Error loading staff tasks:', fetchError);
      setError(fetchError.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const stats = useMemo(() => {
    const counts = Object.fromEntries(STAT_CARDS.map(({ status }) => [status, 0]));
    for (const task of tasks) {
      if (Object.hasOwn(counts, task.status)) counts[task.status] += 1;
    }
    return counts;
  }, [tasks]);

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

    return [...matchingTasks].sort((left, right) => {
      const finishedDifference = Number(FINISHED_STATUSES.has(left.status)) - Number(FINISHED_STATUSES.has(right.status));
      if (finishedDifference !== 0) return finishedDifference;
      return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
    });
  }, [searchQuery, tasks]);

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
          <p className="staff-task-list__eyebrow">Field Operations</p>
          <h1>Assigned Tasks</h1>
          <p>Review and complete the work assigned to you.</p>
        </div>
        <div className="staff-task-list__header-actions">
          <button type="button" className="staff-task-map-button" onClick={onMapView}>
            <Map size={16} aria-hidden="true" /> Map View
          </button>
          <span className="staff-task-list__total">
            <ClipboardList size={16} aria-hidden="true" />
            {tasks.length} assigned
          </span>
        </div>
      </header>

      <section className="staff-task-stats" aria-label="Task statistics">
        {STAT_CARDS.map(({ status, label, icon: Icon, tone }) => (
          <article className={`staff-task-stat staff-task-stat--${tone}`} key={status}>
            <div className="staff-task-stat__icon"><Icon size={20} aria-hidden="true" /></div>
            <div>
              <span>{label}</span>
              <strong>{stats[status]}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="staff-task-list__toolbar" aria-label="Search assigned tasks">
        <div className="staff-task-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by ID, title, location, type, or status"
            aria-label="Search assigned tasks"
          />
          {searchQuery ? (
            <button type="button" onClick={() => { setSearchQuery(''); setPageNumber(1); }} aria-label="Clear search">
              <X size={17} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <span className="staff-task-list__result-count">
          {filteredTasks.length} {filteredTasks.length === 1 ? 'result' : 'results'}
        </span>
      </section>

      {loading ? (
        <div className="staff-task-state" role="status">
          <span className="staff-task-spinner" />
          <p>Loading assigned tasks...</p>
        </div>
      ) : error ? (
        <div className="staff-task-state staff-task-state--error" role="alert">
          <h2>Tasks could not be loaded</h2>
          <p>{error}</p>
          <button type="button" onClick={fetchTasks}>Try Again</button>
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="staff-task-state">
          <ClipboardList size={42} aria-hidden="true" />
          <h2>{tasks.length === 0 ? 'No assigned tasks' : 'No matching tasks'}</h2>
          <p>{tasks.length === 0 ? 'New work will appear here when it is assigned to you.' : 'Try a different search term.'}</p>
        </div>
      ) : (
        <>
          <section className="staff-task-grid" aria-label="Assigned task cards">
            {visibleTasks.map((task) => {
              const location = task.stallCode || task.areaName || 'Location not specified';
              return (
                <article className="staff-task-card" key={task.taskId}>
                  <div className="staff-task-card__topline">
                    <span className="staff-task-card__id">#{task.taskId}</span>
                    <div className="staff-task-card__badges">
                      <span className={`staff-task-badge staff-task-badge--type-${task.taskType.toLowerCase()}`}>
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
                    <p><CalendarDays size={16} aria-hidden="true" /> Assigned {formatDate(task.createdAt)}</p>
                  </div>

                  <footer className="staff-task-card__footer">
                    <button type="button" onClick={() => onViewDetails(task.taskId)}>
                      View Details <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </footer>
                </article>
              );
            })}
          </section>

          {totalPages > 1 ? (
            <nav className="staff-task-pagination" aria-label="Task list pagination">
              <span>
                Showing {(safePageNumber - 1) * PAGE_SIZE + 1}–{Math.min(safePageNumber * PAGE_SIZE, filteredTasks.length)} of {filteredTasks.length}
              </span>
              <div>
                <button
                  type="button"
                  disabled={safePageNumber === 1}
                  onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={17} aria-hidden="true" />
                </button>
                <strong>Page {safePageNumber} of {totalPages}</strong>
                <button
                  type="button"
                  disabled={safePageNumber === totalPages}
                  onClick={() => setPageNumber((current) => Math.min(totalPages, current + 1))}
                  aria-label="Next page"
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
