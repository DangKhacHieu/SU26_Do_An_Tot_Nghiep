import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import { TASK_STATUS, TASK_TYPE } from '../../constants/taskEnums';
import TaskInfoCard from './components/TaskInfoCard';
import QuotationPanel from './components/QuotationPanel';
import UtilityChecklist from './components/UtilityChecklist';
import CompleteTaskForm from './components/CompleteTaskForm';
import RepairProgressStepper from './components/RepairProgressStepper';
import './TaskDetail.css';

export default function TaskDetail({ taskId, baseUrl, onBack, onShowNotification, onViewIssueDetails }) {
  const { t } = useTranslation();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [utilityProgress, setUtilityProgress] = useState({ completed: 0, total: 0 });
  const handleUtilityProgress = useCallback((completed, total) => {
    setUtilityProgress({ completed, total });
  }, []);

  const fetchTaskDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/api/staff/tasks/${taskId}`, { headers: getAuthHeaders() });
      if (!response.ok) {
        let problem = null;
        try {
          problem = await response.json();
        } catch { problem = null; }

        throw new Error(response.status === 404
          ? t('taskdetail.task_not_found_or')
          : problem?.detail || problem?.title || t('taskdetail.failed_to_load_task'));
      }

      setTask(await response.json());
    } catch (fetchError) {
      console.error(t('taskdetail.error_loading_task_details'), fetchError);
      setError(fetchError.message);
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, taskId, t]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  if (loading) {
    return <div className="task-detail-container"><div className="loading-state"><span className="spinner" /> {t('taskdetail.loading_task_details')}</div></div>;
  }

  if (error || !task) {
    return (
      <div className="task-detail-container">
        <div className="error-state">
          <h3>{t('taskdetail.task_details_are_unavailable')}</h3>
          <p className="error-message">{error || t('taskdetail.task_data_was_not')}</p>
          <div className="task-detail-error-actions">
            <button onClick={fetchTaskDetails} className="btn-primary-dark">{t('taskdetail.retry')}</button>
            <button onClick={onBack} className="btn-secondary">{t('taskdetail.back_to_list')}</button>
          </div>
        </div>
      </div>
    );
  }

  const shouldShowCompleteForm = () => {
    if ([TASK_STATUS.COMPLETED, TASK_STATUS.CANCELLED].includes(task.status)) return false;

    if (task.taskType === TASK_TYPE.REPAIR) {
      const isLinked = task.requestId !== null || task.issueId !== null;
      return isLinked
        ? task.status === TASK_STATUS.IN_PROGRESS
        : [TASK_STATUS.PENDING, TASK_STATUS.IN_PROGRESS].includes(task.status);
    }

    return [TASK_STATUS.PENDING, TASK_STATUS.IN_PROGRESS].includes(task.status);
  };

  return (
    <main className="task-detail-container">
      <div className="breadcrumb-path">
        <button type="button" onClick={onBack} className="link-path">{t('taskdetail.daily_tasks')}</button>
        <span>/</span>
        <span className="active-path">{t('taskdetail.task_number', { taskId: task.taskId })}</span>
      </div>

      <header className="detail-header">
        <div>
          <h1 className="main-title">{task.title}</h1>
          <p className="subtitle">
            {t('taskdetail.location')}: {task.stallCode || task.areaName || t('taskdetail.location_not_specified')} | {t('taskdetail.type')}: {task.taskType}
          </p>
        </div>
        <button onClick={onBack} className="btn-secondary">&larr; {t('taskdetail.back_to_list')}</button>
      </header>

      <div className="detail-layout">
        <section className="detail-left-col">
          <TaskInfoCard task={task} onViewIssueDetails={onViewIssueDetails} />

          {task.taskType === TASK_TYPE.REPAIR ? (
            <QuotationPanel
              taskId={task.taskId}
              baseUrl={baseUrl}
              taskStatus={task.status}
              initialMaterials={task.materials}
              onRefreshTask={fetchTaskDetails}
              onShowNotification={onShowNotification}
            />
          ) : null}

          {task.taskType === TASK_TYPE.UTILITY_READING ? (
            <UtilityChecklist
              taskId={task.taskId}
              baseUrl={baseUrl}
              onShowNotification={onShowNotification}
              onProgressChange={handleUtilityProgress}
            />
          ) : null}
        </section>

        <aside className="detail-right-col">
          {task.taskType === TASK_TYPE.REPAIR ? <RepairProgressStepper status={task.status} /> : null}

          {task.status === TASK_STATUS.COMPLETED && (task.imageBeforeUrl || task.imageAfterUrl) ? (
            <div className="evidence-panel">
              <h3 className="card-section-title">{t('taskdetail.completion_evidence')}</h3>
              <div className="evidence-images-grid">
                {task.imageBeforeUrl ? (
                  <div className="evidence-image-wrapper">
                    <div className="evidence-label">{t('taskdetail.before_photo')}</div>
                    <img src={task.imageBeforeUrl} alt={t('taskdetail.before_repair')} className="evidence-img-large" />
                  </div>
                ) : null}
                {task.imageAfterUrl ? (
                  <div className="evidence-image-wrapper">
                    <div className="evidence-label">{t('taskdetail.after_photo')}</div>
                    <img src={task.imageAfterUrl} alt={t('taskdetail.after_repair')} className="evidence-img-large" />
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {shouldShowCompleteForm() ? (
            <CompleteTaskForm
              task={task}
              baseUrl={baseUrl}
              onRefreshTask={fetchTaskDetails}
              onShowNotification={onShowNotification}
              utilityProgress={task.taskType === TASK_TYPE.UTILITY_READING ? utilityProgress : null}
            />
          ) : null}
        </aside>
      </div>
    </main>
  );
}
