import { useTranslation } from 'react-i18next';
import { TASK_STATUS, TASK_TYPE } from '../../../constants/taskEnums';

export default function TaskInfoCard({ task, onViewIssueDetails }) {
  const { t } = useTranslation();

  const formatDate = (dateString) => {
    if (!dateString) return t('taskinfocard.pending_completion');
    return new Date(dateString).toLocaleDateString(t('taskinfocard.enus'), {
      year: t('taskinfocard.numeric'),
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case TASK_STATUS.PENDING: return t('taskinfocard.badgepending');
      case TASK_STATUS.PENDING_APPROVAL: return t('taskinfocard.badgeapproval');
      case TASK_STATUS.IN_PROGRESS: return t('taskinfocard.badgeprogress');
      case TASK_STATUS.COMPLETED: return t('taskinfocard.badgecompleted');
      case TASK_STATUS.CANCELLED: return t('taskinfocard.badgecancelled');
      default: return t('taskinfocard.badgedefault');
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case TASK_TYPE.REPAIR: return t('taskinfocard.repair');
      case TASK_TYPE.MAINTENANCE: return t('taskinfocard.maintenance');
      case TASK_TYPE.UTILITY_READING: return t('taskinfocard.meter_reading');
      default: return type;
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case TASK_TYPE.REPAIR: return t('taskinfocard.badgerepair');
      case TASK_TYPE.MAINTENANCE: return t('taskinfocard.badgemaintenance');
      case TASK_TYPE.UTILITY_READING: return t('taskinfocard.badgeutility');
      default: return t('taskinfocard.badgedefault');
    }
  };

  return (
    <div className="task-info-card">
      <div className="card-header-with-badge">
        <h3 className="card-section-title">📌 Task Details</h3>
        <div className="badges-group">
          <span className={`type-badge ${getTypeBadgeClass(task.taskType)}`}>
            {getTypeLabel(task.taskType)}
          </span>
          <span className={`status-badge ${getStatusBadgeClass(task.status)}`}>
            {getStatusLabel(task.status)}
          </span>
        </div>
      </div>

      <div className="task-info-grid">
        <div className="info-item full-width">
          <span className="info-label">{t('taskinfocard.task_title')}</span>
          <span className="info-value text-highlight">{task.title}</span>
        </div>

        {task.description && (
          <div className="info-item full-width">
            <span className="info-label">{t('taskinfocard.description')}</span>
            <span className="info-value description-text">{task.description}</span>
          </div>
        )}

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

        <div className="info-item">
          <span className="info-label">{t('taskinfocard.created_date')}</span>
          <span className="info-value">{formatDate(task.createdAt)}</span>
        </div>

        <div className="info-item">
          <span className="info-label">{t('taskinfocard.completed_date')}</span>
          <span className="info-value">{formatDate(task.completedAt)}</span>
        </div>

        {task.requestId && (
          <div className="info-item">
            <span className="info-label">{t('taskinfocard.linked_request')}</span>
            <span className="info-value font-monospace">{task.requestId}</span>
          </div>
        )}

        {task.issueId && (
          <div className="info-item">
            <span className="info-label">{t('taskinfocard.linked_issue')}</span>
            <span 
              className="info-value font-monospace" 
              style={{ color: '#2563eb', cursor: t('taskinfocard.pointer'), textDecoration: t('taskinfocard.underline'), fontWeight: 'bold' }}
              onClick={() => onViewIssueDetails && onViewIssueDetails(task.issueId)}
            >
              #ISSUE-{task.issueId}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
