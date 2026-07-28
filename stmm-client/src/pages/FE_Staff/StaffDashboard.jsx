import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import { TASK_STATUS } from '../../constants/taskEnums';

export default function StaffDashboard({ baseUrl, staffName, onOpenTasks, onOpenTask }) {
  const { t } = useTranslation();

  const dashboardStats = useMemo(() => [
    [TASK_STATUS.PENDING, t('staffdashboard.pending')],
    [TASK_STATUS.PENDING_APPROVAL, t('staffdashboard.pending_approval')],
    [TASK_STATUS.IN_PROGRESS, t('staffdashboard.in_progress')],
    [TASK_STATUS.COMPLETED, t('staffdashboard.completed')],
  ], [t]);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadTasks = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/staff/tasks`, { headers: getAuthHeaders() });
        if (!response.ok) {
          const problem = await response.json().catch(() => null);
          throw new Error(problem?.detail || problem?.title || t('staffdashboard.unable_to_load_your'));
        }
        const data = await response.json();
        if (active) setTasks(Array.isArray(data) ? data : []);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadTasks();
    return () => { active = false; };
  }, [baseUrl]);

  const counts = useMemo(() => Object.fromEntries(
    dashboardStats.map(([status]) => [status, tasks.filter((task) => task.status === status).length]),
  ), [tasks, dashboardStats]);

  const recentTasks = useMemo(() => [...tasks]
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
    .slice(0, 5), [tasks]);

  return (
    <main className="staff-dashboard-page">
      <header className="staff-dashboard-hero">
        <div><span>{t('staffdashboard.daily_overview')}</span><h1>Welcome back, {staffName || t('staffdashboard.staff')}</h1><p>{t('staffdashboard.review_your_workload_and')}</p></div>
        <button type="button" className="btn-primary-dark" onClick={onOpenTasks}>{t('staffdashboard.view_all_tasks')}</button>
      </header>
      {error ? <div className="error-state">{error}</div> : null}
      <section className="staff-dashboard-stats" aria-label={t('staffdashboard.task_summary')}>
        {dashboardStats.map(([status, label]) => <article key={status}><span>{label}</span><strong>{loading ? '-' : counts[status]}</strong></article>)}
      </section>
      <section className="staff-dashboard-recent">
        <div className="staff-dashboard-section-heading"><div><h2>{t('staffdashboard.recent_tasks')}</h2><p>{t('staffdashboard.your_latest_assigned_work')}</p></div><button type="button" className="btn-link" onClick={onOpenTasks}>{t('staffdashboard.view_all')}</button></div>
        {loading ? <div className="loading-state">{t('staffdashboard.loading_tasks')}</div> : null}
        {!loading && recentTasks.length === 0 ? <div className="empty-state">{t('staffdashboard.no_assigned_tasks_yet')}</div> : null}
        {!loading && recentTasks.map((task) => (
          <button type="button" className="staff-dashboard-task" key={task.taskId} onClick={() => onOpenTask(task.taskId)}>
            <span><strong>#{task.taskId} {task.title}</strong><small>{task.stallCode || task.areaName || t('staffdashboard.location_not_specified')}</small></span>
            <span className={`status-badge ${String(task.status || '').toLowerCase()}`}>{task.status}</span>
          </button>
        ))}
      </section>
    </main>
  );
}
