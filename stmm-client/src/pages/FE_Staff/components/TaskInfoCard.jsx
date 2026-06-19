import React from 'react';
import { TASK_STATUS, TASK_TYPE } from '../../../constants/taskEnums';

export default function TaskInfoCard({ task }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'Pending completion';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case TASK_STATUS.PENDING: return 'Pending';
      case TASK_STATUS.PENDING_APPROVAL: return 'Pending Quote Approval';
      case TASK_STATUS.IN_PROGRESS: return 'In Progress';
      case TASK_STATUS.COMPLETED: return 'Completed';
      case TASK_STATUS.CANCELLED: return 'Cancelled';
      default: return status;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case TASK_STATUS.PENDING: return 'badge-pending';
      case TASK_STATUS.PENDING_APPROVAL: return 'badge-approval';
      case TASK_STATUS.IN_PROGRESS: return 'badge-progress';
      case TASK_STATUS.COMPLETED: return 'badge-completed';
      case TASK_STATUS.CANCELLED: return 'badge-cancelled';
      default: return 'badge-default';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case TASK_TYPE.REPAIR: return 'Repair';
      case TASK_TYPE.MAINTENANCE: return 'Maintenance';
      case TASK_TYPE.UTILITY_READING: return 'Meter Reading';
      case TASK_TYPE.CASH_COLLECTION: return 'Cash Collection';
      default: return type;
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case TASK_TYPE.REPAIR: return 'badge-repair';
      case TASK_TYPE.MAINTENANCE: return 'badge-maintenance';
      case TASK_TYPE.UTILITY_READING: return 'badge-utility';
      case TASK_TYPE.CASH_COLLECTION: return 'badge-cash';
      default: return 'badge-default';
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
          <span className="info-label">Task Title:</span>
          <span className="info-value text-highlight">{task.title}</span>
        </div>

        {task.description && (
          <div className="info-item full-width">
            <span className="info-label">Description:</span>
            <span className="info-value description-text">{task.description}</span>
          </div>
        )}

        <div className="info-item">
          <span className="info-label">Task ID:</span>
          <span className="info-value font-monospace">{task.taskId}</span>
        </div>

        <div className="info-item">
          <span className="info-label">Area/Location:</span>
          <span className="info-value">{task.areaName || 'All Stalls (Unlimited)'}</span>
        </div>

        <div className="info-item">
          <span className="info-label">Assigned To:</span>
          <span className="info-value">{task.assignedToName || 'Unassigned'}</span>
        </div>

        <div className="info-item">
          <span className="info-label">Created Date:</span>
          <span className="info-value">{formatDate(task.createdAt)}</span>
        </div>

        <div className="info-item">
          <span className="info-label">Completed Date:</span>
          <span className="info-value">{formatDate(task.completedAt)}</span>
        </div>

        {task.requestId && (
          <div className="info-item">
            <span className="info-label">Linked Request:</span>
            <span className="info-value font-monospace">{task.requestId}</span>
          </div>
        )}

        {task.issueId && (
          <div className="info-item">
            <span className="info-label">Linked Issue:</span>
            <span className="info-value font-monospace">{task.issueId}</span>
          </div>
        )}
      </div>
    </div>
  );
}
