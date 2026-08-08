import { useTranslation } from 'react-i18next';
import { ClipboardList } from 'lucide-react';
import { TASK_STATUS, TASK_TYPE } from '../../../constants/taskEnums';

const STATUS_BADGE_CLASS = {
  [TASK_STATUS.PENDING]: 'badge-pending',
  [TASK_STATUS.PENDING_APPROVAL]: 'badge-approval',
  [TASK_STATUS.IN_PROGRESS]: 'badge-progress',
  [TASK_STATUS.COMPLETED]: 'badge-completed',
  [TASK_STATUS.CANCELLED]: 'badge-cancelled',
};

const TYPE_BADGE_CLASS = {
  [TASK_TYPE.REPAIR]: 'badge-repair',
  [TASK_TYPE.UTILITY_READING]: 'badge-utility',
};

export default function TaskInfoCard({ task, onViewIssueDetails }) {
  const { t, i18n } = useTranslation();
  const locale = i18n?.language?.startsWith('vi') ? 'vi-VN' : 'en-US';
  const isUtilityTask = task.taskType === TASK_TYPE.UTILITY_READING;

  const formatDate = (dateString) => {
    if (!dateString) return t('taskinfocard.pending_completion');
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatReadingPeriod = () => {
    const referenceDate = task.completedAt || task.CompletedAt || task.createdAt || task.CreatedAt || new Date().toISOString();
    return new Date(referenceDate).toLocaleDateString(locale, {
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case TASK_STATUS.PENDING: return t('taskinfocard.pending');
      case TASK_STATUS.PENDING_APPROVAL: return t('taskinfocard.pending_approval');
      case TASK_STATUS.IN_PROGRESS: return t('taskinfocard.in_progress');
      case TASK_STATUS.COMPLETED: return t('taskinfocard.completed');
      case TASK_STATUS.CANCELLED: return t('taskinfocard.cancelled');
      default: return status;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case TASK_TYPE.REPAIR: return t('taskinfocard.repair');
      case TASK_TYPE.UTILITY_READING: return t('taskinfocard.meter_reading');
      default: return type;
    }
  };

  return (
    <section className={`task-info-card ${isUtilityTask ? 'task-info-card--utility' : ''}`}>
      <div className="card-header-with-badge">
        <h3 className="card-section-title">
          <ClipboardList size={18} aria-hidden="true" />
          {t('taskinfocard.task_details')}
        </h3>
        <div className="badges-group">
          <span className={`type-badge ${TYPE_BADGE_CLASS[task.taskType] || 'badge-default'}`}>
            {getTypeLabel(task.taskType)}
          </span>
          <span className={`status-badge ${STATUS_BADGE_CLASS[task.status] || 'badge-default'}`}>
            {getStatusLabel(task.status)}
          </span>
        </div>
      </div>

      <div className="task-info-grid">
        {!isUtilityTask ? (
          <div className="info-item full-width">
            <span className="info-label">{t('taskinfocard.task_title')}</span>
            <span className="info-value text-highlight">{task.title}</span>
          </div>
        ) : null}

        {task.description ? (
          <div className="info-item full-width">
            <span className="info-label">{t('taskinfocard.description')}</span>
            <span className="info-value description-text">{task.description}</span>
          </div>
        ) : null}

        <div className="info-item">
          <span className="info-label">{t('taskinfocard.task_id')}</span>
          <span className="info-value font-monospace">{task.taskId}</span>
        </div>

        <div className="info-item">
          <span className="info-label">{t('taskinfocard.arealocation')}</span>
          <span className="info-value">{task.stallCode || task.areaName || t('taskinfocard.location_not_specified')}</span>
        </div>

        <div className="info-item">
          <span className="info-label">{t('taskinfocard.assigned_to')}</span>
          <span className="info-value">{task.assignedToName || t('taskinfocard.unassigned')}</span>
        </div>

        {isUtilityTask ? (
          <div className="info-item">
            <span className="info-label">{t('taskinfocard.reading_period')}</span>
            <span className="info-value">{formatReadingPeriod()}</span>
          </div>
        ) : null}

        <div className="info-item">
          <span className="info-label">{t('taskinfocard.created_date')}</span>
          <span className="info-value">{formatDate(task.createdAt)}</span>
        </div>

        <div className="info-item">
          <span className="info-label">{t('taskinfocard.completed_date')}</span>
          <span className="info-value">{formatDate(task.completedAt)}</span>
        </div>

        {task.requestId ? (
          <div className="info-item">
            <span className="info-label">{t('taskinfocard.linked_request')}</span>
            <span className="info-value font-monospace">{task.requestId}</span>
          </div>
        ) : null}

        {task.issueId ? (
          <div className="info-item">
            <span className="info-label">{t('taskinfocard.linked_issue')}</span>
            <button
              type="button"
              className="info-value font-monospace task-info-link"
              onClick={() => onViewIssueDetails?.(task.issueId)}
            >
              #ISSUE-{task.issueId}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
