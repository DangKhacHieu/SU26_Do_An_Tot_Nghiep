import { useEffect, useMemo, useState } from 'react';
import { TASK_STATUS } from '../../constants/taskEnums';

const dashboardStats = [
  [TASK_STATUS.PENDING, 'Pending'],
  [TASK_STATUS.PENDING_APPROVAL, 'Pending Approval'],
  [TASK_STATUS.IN_PROGRESS, 'In Progress'],
  [TASK_STATUS.COMPLETED, 'Completed'],
];

export default function StaffDashboard({ baseUrl, staffName, onOpenTasks, onOpenTask }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadTasks = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/staff/tasks`);
        if (!response.ok) {
          const problem = await response.json().catch(() => null);
          throw new Error(problem?.detail || problem?.title || 'Unable to load your dashboard.');
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
  ), [tasks]);

  const recentTasks = useMemo(() => [...tasks]
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
    .slice(0, 5), [tasks]);

  return (
    <main className="staff-dashboard-page">
      <header className="staff-dashboard-hero">
        <div><span>DAILY OVERVIEW</span><h1>Welcome back, {staffName || 'Staff'}</h1><p>Review your workload and continue the most recent assignments.</p></div>
        <button type="button" className="btn-primary-dark" onClick={onOpenTasks}>View All Tasks</button>
      </header>
      {error ? <div className="error-state">{error}</div> : null}
      <section className="staff-dashboard-stats" aria-label="Task summary">
        {dashboardStats.map(([status, label]) => <article key={status}><span>{label}</span><strong>{loading ? '-' : counts[status]}</strong></article>)}
      </section>
      <section className="staff-dashboard-recent">
        <div className="staff-dashboard-section-heading"><div><h2>Recent Tasks</h2><p>Your latest assigned work.</p></div><button type="button" className="btn-link" onClick={onOpenTasks}>View all</button></div>
        {loading ? <div className="loading-state">Loading tasks...</div> : null}
        {!loading && recentTasks.length === 0 ? <div className="empty-state">No assigned tasks yet.</div> : null}
        {!loading && recentTasks.map((task) => (
          <button type="button" className="staff-dashboard-task" key={task.taskId} onClick={() => onOpenTask(task.taskId)}>
            <span><strong>#{task.taskId} {task.title}</strong><small>{task.stallCode || task.areaName || 'Location not specified'}</small></span>
            <span className={`status-badge ${String(task.status || '').toLowerCase()}`}>{task.status}</span>
          </button>
        ))}
      </section>
    </main>
  );
}
