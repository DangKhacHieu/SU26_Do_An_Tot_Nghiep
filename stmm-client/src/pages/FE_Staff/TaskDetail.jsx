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

  useEffect(() => {
    document.title = "Task Details - STMM Staff";
  }, []);

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

  // SEO & metadata management
  useEffect(() => {
    if (!task) return;
    const originalTitle = document.title;
    document.title = `STMM - Chi tiết Tác vụ #${task.taskId}`;

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute("content") : "";

    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", `Chi tiết tác vụ ${task.title}. Loại tác vụ: ${task.taskType}, trạng thái: ${task.status}.`);

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
  }, [task]);

  if (forbidden) {
    return (
      <main className="task-detail-container" id="task-detail-forbidden" aria-labelledby="forbidden-title">
        <nav className="breadcrumb-path" id="breadcrumb-forbidden-nav">
          <span>Dashboard</span> &gt; <span>Daily Tasks</span> &gt; <span className="active-path">Access Error</span>
        </nav>
        <div className="error-state">
          <span className="error-icon" style={{ fontSize: '48px' }}>🚫</span>
          <h1 id="forbidden-title">Access Denied</h1>
          <p className="error-message">You are not assigned to perform this task.</p>
          <button onClick={onBack} className="btn-primary-dark" id="btn-forbidden-back">Back to List</button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="task-detail-container" id="task-detail-loading" aria-labelledby="loading-title">
        <h1 id="loading-title" className="sr-only">Loading Task Details</h1>
        <div className="loading-state">
          <span className="spinner"></span> Loading task details...
        </div>
      </main>
    );
  }

  if (error || !task) {
    return (
      <main className="task-detail-container" id="task-detail-error" aria-labelledby="error-title">
        <div className="error-state">
          <h1 id="error-title">An error occurred</h1>
          <p className="error-message">{error || 'Task data not found.'}</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={fetchTaskDetails} className="btn-primary-dark" id="btn-error-retry">Retry</button>
            <button onClick={onBack} className="btn-secondary" id="btn-error-back">Back</button>
          </div>
        </div>
      </main>
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

    return task.status === TASK_STATUS.PENDING || task.status === TASK_STATUS.IN_PROGRESS;
  };

  const hasRightColContent = (task.status === TASK_STATUS.COMPLETED && (task.imageBeforeUrl || task.imageAfterUrl)) || shouldShowCompleteForm();

  return (
    <main className="task-detail-container" id="task-detail-main-view" aria-labelledby="task-detail-title">
      <nav className="breadcrumb-path" id="breadcrumb-path-nav">
        <span onClick={onBack} className="link-path" style={{ cursor: 'pointer' }} id="breadcrumb-dashboard">Dashboard</span> &gt; 
        <span onClick={onBack} className="link-path" style={{ cursor: 'pointer' }} id="breadcrumb-tasks"> Daily Tasks</span> &gt; 
        <span className="active-path" id="breadcrumb-details"> Details {task.taskId}</span>
      </nav>

      <header className="detail-header" id="task-detail-header">
        <div>
          <h1 className="main-title" id="task-detail-title">Task: {task.title}</h1>
          <p className="subtitle">Stall/Area: {task.areaName || 'Khu vực hạ tầng chung (Chợ)'} | Type: {task.taskType}</p>
        </div>
        <button onClick={onBack} className="btn-secondary" id="btn-task-detail-back">
          &larr; Back to List
        </button>
      </header>

      <section className={`detail-layout ${hasRightColContent ? 'two-cols' : 'one-col'}`} id="task-detail-layout-section">
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

        <aside className="detail-right-col" id="task-detail-sidebar">
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
        </aside>
      </section>
    </main>
  );
}
