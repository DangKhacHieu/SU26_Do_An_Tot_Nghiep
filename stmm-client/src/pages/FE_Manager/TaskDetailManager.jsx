import React, { useState, useEffect } from 'react';
import './TaskDetailManager.css';
import AssignStaffModal from './AssignStaffModal';
import UpdateTaskStatusModal from './UpdateTaskStatusModal';

/* ── Inline Icons ── */
const IconBack = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconUser = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconEditStatus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;

export default function TaskDetailManager({ taskId, userId, baseUrl, onBack, addToast, navigate }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal triggers
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    fetchTaskDetails();
  }, [baseUrl, taskId]);

  const fetchTaskDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/manager/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      } else {
        addToast('Failed to load task details.', 'error');
      }
    } catch (err) {
      console.error('Error fetching task details:', err);
      addToast('Network error loading details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="task-detail-loading">
        <div className="spinner"></div>
        <p>Fetching technical details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-detail-error">
        <p>Task not found or has been removed.</p>
        <button className="btn-secondary" onClick={onBack}>
          <IconBack /> BACK TO LIST
        </button>
      </div>
    );
  }



  const formatTaskType = (type) => {
    if (type === 'UtilityReading') return 'Utility Reading';
    if (type === 'CashCollection') return 'Cash Collection';
    return type;
  };

  const formatStatus = (status) => {
    if (status === 'PendingApproval') return 'Pending Approval';
    if (status === 'In_Progress') return 'In Progress';
    return status;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ';
  };



  // Materials total
  const materialsTotal = (task.materials || []).reduce((acc, m) => acc + (m.amount || 0), 0);

  return (
    <div className="task-detail-container">
      {/* ── Top Header Navbar ── */}
      <div className="detail-action-bar">
        <button className="btn-secondary back-btn" onClick={onBack}>
          <IconBack /> BACK TO LIST
        </button>
        <div className="action-buttons-group">
          {task.status !== 'Completed' && task.status !== 'Cancelled' && (
            <>
              <button className="btn-secondary" onClick={() => setShowAssignModal(true)}>
                <IconUser /> REASSIGN STAFF
              </button>
              {!(task.status === 'PendingApproval' && task.requestId) && (
                <button className="btn-primary" onClick={() => setShowStatusModal(true)}>
                  <IconEditStatus /> UPDATE STATUS
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {task.status === 'PendingApproval' && task.requestId && (
        <div className="manager-quotation-pending-vendor-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">
            Báo giá vật tư của tác vụ này đang chờ Vendor (Tiểu thương) của Yêu cầu{' '}
            <span 
              className="warning-link"
              onClick={() => navigate('request-detail', task.requestId)}
            >
              #REQ-{task.requestId}
            </span>{' '}
            phê duyệt trực tuyến. Manager không thể duyệt trực tiếp tại đây.
          </span>
        </div>
      )}

      <div className="detail-grid">
        {/* ── LEFT COLUMN: TECHNICAL SPECS ── */}
        <div className="detail-left-column">
          {/* Summary Card */}
          <div className="spec-card">
            <h3 className="spec-title">TASK SPECIFICATIONS</h3>
            
            <div className="summary-fields-grid">
              <div className="summary-field">
                <span className="summary-label">TASK LABEL</span>
                <span className="summary-val text-bold">{task.title}</span>
              </div>
              <div className="summary-field">
                <span className="summary-label">TASK TYPE</span>
                <span className="summary-val task-type-badge">{formatTaskType(task.taskType)}</span>
              </div>
              <div className="summary-field">
                <span className="summary-label">WORK AREA</span>
                <span className="summary-val">{task.areaName || 'Independent / General Area'}</span>
              </div>
              <div className="summary-field">
                <span className="summary-label">COORDINATOR</span>
                <span className="summary-val">System Manager</span>
              </div>
              {task.requestId && (
                <div className="summary-field">
                  <span className="summary-label">LINKED CUSTOMER REQUEST</span>
                  <span 
                    className="summary-val text-bold" 
                    style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => navigate('request-detail', task.requestId)}
                  >
                    #REQ-{task.requestId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="spec-card">
            <h3 className="spec-title">OPERATIONAL SPECIFICATIONS</h3>
            <p className="spec-desc-text">{task.description || 'No technical constraints provided.'}</p>
          </div>

          {/* Quotation Materials */}
          {(task.taskType === 'Repair' || task.taskType === 'Maintenance') && (
            <div className="spec-card">
              <h3 className="spec-title">REQUIRED MATERIALS & QUOTATION</h3>
              {(!task.materials || task.materials.length === 0) ? (
                <div className="materials-empty-state">
                  No spare parts or materials have been registered for this task.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="materials-table">
                    <thead>
                      <tr>
                        <th>Spare Part / Item Name</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Unit Price</th>
                        <th style={{ textAlign: 'right' }}>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {task.materials.map((m) => (
                        <tr key={m.id}>
                          <td className="material-name-td">{m.itemName}</td>
                          <td style={{ textAlign: 'center' }}>{m.quantity}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(m.unitPrice)}</td>
                          <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(m.amount)}</td>
                        </tr>
                      ))}
                      <tr className="materials-total-row">
                        <td colSpan="3" style={{ textAlign: 'right', fontWeight: '700' }}>SUBTOTAL:</td>
                        <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--color-primary, #2563eb)' }}>
                          {formatCurrency(materialsTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Evidence Photos */}
          {(task.taskType === 'Repair' || task.taskType === 'Maintenance') && (
            <div className="spec-card">
              <h3 className="spec-title">EVIDENCE CAPTURES</h3>
              <div className="evidence-photos-grid">
                <div className="evidence-photo-box">
                  <span className="evidence-photo-label">BEFORE TASK REPAIR</span>
                  {task.imageBeforeUrl ? (
                    <img src={task.imageBeforeUrl} alt="Before Repair Evidence" className="evidence-img" />
                  ) : (
                    <div className="evidence-photo-placeholder">
                      <span>No pre-repair photograph uploaded.</span>
                    </div>
                  )}
                </div>
                <div className="evidence-photo-box">
                  <span className="evidence-photo-label">AFTER TASK COMPLETION</span>
                  {task.imageAfterUrl ? (
                    <img src={task.imageAfterUrl} alt="After Repair Evidence" className="evidence-img" />
                  ) : (
                    <div className="evidence-photo-placeholder">
                      <span>No completion certificate photograph uploaded.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: WORKFLOW STATUS & HISTORY ── */}
        <div className="detail-right-column">
          {/* Current Status Badge Widget */}
          <div className="spec-card status-widget-card">
            <span className="status-widget-title">CURRENT OPERATION STATE</span>
            <div className={`status-widget-badge status-${task.status.toLowerCase()}`}>
              <span className="status-widget-dot"></span>
              {formatStatus(task.status)}
            </div>
            
            <div className="assignee-card-small">
              <div className="assignee-avatar-small">
                {task.assignedToName ? task.assignedToName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
              </div>
              <div className="assignee-details-small">
                <span className="assignee-role-label">ASSIGNED STAFF MEMBER</span>
                <span className="assignee-name-val">{task.assignedToName || 'Unassigned'}</span>
              </div>
            </div>

            {task.actualCost !== null && task.actualCost !== undefined && (
              <div className="cost-summary-box">
                <span className="cost-summary-label">OPEX ACTUAL COST</span>
                <span className="cost-summary-val">{formatCurrency(task.actualCost)}</span>
              </div>
            )}
          </div>

          {/* Dynamic Activity Timeline */}
          <div className="spec-card">
            <h3 className="spec-title">ACTIVITY HISTORY LOG</h3>
            <div className="timeline-container">
              
              {/* Event 1: Created */}
              <div className="timeline-item is-done">
                <div className="timeline-badge"></div>
                <div className="timeline-content">
                  <span className="timeline-date">{formatDate(task.createdAt)}</span>
                  <span className="timeline-event-title">Task Entry Created</span>
                  <p className="timeline-event-desc">
                    Initial task specification and details recorded by system manager.
                  </p>
                </div>
              </div>

              {/* Event 2: Staff Assigned */}
              <div className="timeline-item is-done">
                <div className="timeline-badge"></div>
                <div className="timeline-content">
                  <span className="timeline-date">{formatDate(task.createdAt)}</span>
                  <span className="timeline-event-title">Staff Member Assigned</span>
                  <p className="timeline-event-desc">
                    Assigned coordination authority and execution to <strong>{task.assignedToName || 'Unassigned'}</strong>.
                  </p>
                </div>
              </div>

              {/* Event 3: Completed */}
              {task.status === 'Completed' && (
                <div className="timeline-item is-done completed">
                  <div className="timeline-badge"></div>
                  <div className="timeline-content">
                    <span className="timeline-date">{formatDate(task.completedAt)}</span>
                    <span className="timeline-event-title">
                      {task.taskType === 'UtilityReading' ? 'Meter Readings Completed' : 'Task Repair Completed'}
                    </span>
                    <p className="timeline-event-desc">
                      {task.completionNotes ? (
                        <>
                          <strong>Staff Note:</strong> "{task.completionNotes}"
                        </>
                      ) : (
                        "Marked as successfully completed by field staff."
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Event 4: Cancelled */}
              {task.status === 'Cancelled' && (
                <div className="timeline-item is-cancelled">
                  <div className="timeline-badge"></div>
                  <div className="timeline-content">
                    <span className="timeline-event-title">Task Terminated / Cancelled</span>
                    <p className="timeline-event-desc">
                      Task coordination rejected or cancelled by system manager.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showAssignModal && (
        <AssignStaffModal
          taskId={task.taskId}
          currentStaffId={task.assignedToUserId}
          baseUrl={baseUrl}
          onClose={() => setShowAssignModal(false)}
          onSuccess={(updated) => {
            setShowAssignModal(false);
            setTask(updated);
          }}
          addToast={addToast}
        />
      )}

      {showStatusModal && (
        <UpdateTaskStatusModal
          taskId={task.taskId}
          currentStatus={task.status}
          baseUrl={baseUrl}
          onClose={() => setShowStatusModal(false)}
          onSuccess={(updated) => {
            setShowStatusModal(false);
            setTask(updated);
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}
