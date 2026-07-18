import React, { useState, useEffect } from 'react';
import { TASK_STATUS, TASK_TYPE } from '../../constants/taskEnums';
import TaskInfoCard from './components/TaskInfoCard';
import QuotationPanel from './components/QuotationPanel';
import UtilityChecklist from './components/UtilityChecklist';
import CompleteTaskForm from './components/CompleteTaskForm';
import './TaskDetail.css';

export default function TaskDetail({ taskId, userId, baseUrl, onBack, onShowNotification, onViewIssueDetails }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [utilityProgress, setUtilityProgress] = useState({ completed: 0, total: 0 });

  const fetchTaskDetails = async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const response = await fetch(`${baseUrl}/api/staff/tasks/${taskId}?userId=${userId}`);
      if (response.status === 403) {
        setForbidden(true);
        return;
      }
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Task not found.' : `Failed to load task: ${response.statusText}`);
      }
      const data = await response.json();
      setTask(data);
    } catch (err) {
      console.error('Error loading task details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId, userId]);

  if (forbidden) {
    return (
      <div className="task-detail-container">
        <div className="breadcrumb-path">
          <span>Dashboard</span> &gt; <span>Daily Tasks</span> &gt; <span className="active-path">Access Error</span>
        </div>
        <div className="error-state">
          <span className="error-icon" style={{ fontSize: '48px' }}>🚫</span>
          <h3>Access Denied</h3>
          <p className="error-message">You are not assigned to perform this task.</p>
          <button onClick={onBack} className="btn-primary-dark">Back to List</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="task-detail-container">
        <div className="loading-state">
          <span className="spinner"></span> Loading task details...
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="task-detail-container">
        <div className="error-state">
          <h3>An error occurred</h3>
          <p className="error-message">{error || 'Task data not found.'}</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={fetchTaskDetails} className="btn-primary-dark">Retry</button>
            <button onClick={onBack} className="btn-secondary">Back</button>
          </div>
        </div>
      </div>
    );
  }

  // Evaluate complete form display condition based on Business Rules in revised plan
  const shouldShowCompleteForm = () => {
    if (task.status === TASK_STATUS.COMPLETED || task.status === TASK_STATUS.CANCELLED) {
      return false;
    }

    if (task.taskType === TASK_TYPE.REPAIR) {
      const isLinkedToIssueOrRequest = task.requestId !== null || task.issueId !== null;
      if (isLinkedToIssueOrRequest) {
        // Repair có RequestId/IssueId -> chỉ hiện khi status === 'In_Progress'
        return task.status === TASK_STATUS.IN_PROGRESS;
      } else {
        // Repair không có link -> hiện khi status === 'Pending' hoặc 'In_Progress'
        return task.status === TASK_STATUS.PENDING || task.status === TASK_STATUS.IN_PROGRESS;
      }
    }

    // Maintenance, UtilityReading, CashCollection -> hiện khi status === 'Pending' hoặc 'In_Progress'
    return task.status === TASK_STATUS.PENDING || task.status === TASK_STATUS.IN_PROGRESS;
  };

  return (
    <div className="task-detail-container">
      <div className="breadcrumb-path">
        <span onClick={onBack} className="link-path" style={{ cursor: 'pointer' }}>Dashboard</span> &gt; 
        <span onClick={onBack} className="link-path" style={{ cursor: 'pointer' }}> Daily Tasks</span> &gt; 
        <span className="active-path"> Details {task.taskId}</span>
      </div>

      <div className="section-header">
        <div>
          <h1 className="main-title">Task: {task.title}</h1>
          <p className="subtitle">Stall/Area: {task.areaName || 'None'} | Type: {task.taskType}</p>
        </div>
        <button onClick={onBack} className="btn-secondary">
          &larr; Back to List
        </button>
      </div>

      <div className="detail-layout">
        <div className="detail-left-col">
          {/* Task main read-only info card */}
          <TaskInfoCard task={task} onViewIssueDetails={onViewIssueDetails} />

          {/* Quotation management for Repair tasks */}
          {task.taskType === TASK_TYPE.REPAIR && (
            <QuotationPanel 
              taskId={task.taskId}
              userId={userId}
              baseUrl={baseUrl}
              taskStatus={task.status}
              initialMaterials={task.materials}
              onRefreshTask={fetchTaskDetails}
              onShowNotification={onShowNotification}
            />
          )}

          {/* Stall checklist for Utility reading tasks */}
          {task.taskType === TASK_TYPE.UTILITY_READING && (
            <UtilityChecklist 
              taskId={task.taskId}
              userId={userId}
              baseUrl={baseUrl}
              onShowNotification={onShowNotification}
              onProgressChange={(completed, total) => setUtilityProgress({ completed, total })}
            />
          )}
        </div>

        <div className="detail-right-col">
          {/* Read-only evidence preview if task is already completed */}
          {task.status === TASK_STATUS.COMPLETED && (task.imageBeforeUrl || task.imageAfterUrl) && (
            <div className="evidence-panel">
              <h3 className="card-section-title">📸 Completion Evidence Photos</h3>
              <div className="evidence-images-grid">
                {task.imageBeforeUrl && (
                  <div className="evidence-image-wrapper">
                    <div className="evidence-label">BEFORE PHOTO</div>
                    <img src={task.imageBeforeUrl} alt="Before repair" className="evidence-img-large" />
                  </div>
                )}
                {task.imageAfterUrl && (
                  <div className="evidence-image-wrapper">
                    <div className="evidence-label">AFTER PHOTO</div>
                    <img src={task.imageAfterUrl} alt="After repair" className="evidence-img-large" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Complete Task Form */}
          {shouldShowCompleteForm() && (
            <CompleteTaskForm 
              task={task}
              userId={userId}
              baseUrl={baseUrl}
              onRefreshTask={fetchTaskDetails}
              onShowNotification={onShowNotification}
              utilityProgress={task.taskType === TASK_TYPE.UTILITY_READING ? utilityProgress : null}
            />
          )}
        </div>
      </div>
    </div>
  );
}
