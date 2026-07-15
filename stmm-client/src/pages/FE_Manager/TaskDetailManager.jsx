import React, { useState, useEffect } from 'react';
import './TaskDetailManager.css';
import AssignStaffModal from './AssignStaffModal';
import UpdateTaskStatusModal from './UpdateTaskStatusModal';

/* ── Inline Icons ── */
const IconBack = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconUser = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconCancel = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;

export default function TaskDetailManager({ taskId, userId, baseUrl, onBack, addToast, navigate }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal triggers
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'primary',
    title: '',
    message: '',
    onConfirm: null
  });

  const handleResolveQuote = (approve) => {
    setConfirmModal({
      isOpen: true,
      type: approve ? 'primary' : 'danger',
      title: approve ? 'Approve Quotation' : 'Reject Quotation',
      message: approve 
        ? 'Are you sure you want to APPROVE this quotation and start construction?' 
        : 'Are you sure you want to REJECT this quotation and request staff to re-evaluate?',
      onConfirm: () => executeResolveQuote(approve)
    });
  };

  const executeResolveQuote = async (approve) => {
    setSubmittingQuote(true);
    try {
      const res = await fetch(`${baseUrl}/api/manager/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus: approve ? 'In_Progress' : 'Pending' })
      });

      if (res.ok) {
        addToast(approve ? 'Quotation approved successfully!' : 'Quotation rejected. Staff has been notified to re-evaluate.', 'success');
        const updatedTask = await res.json();
        setTask(updatedTask);
      } else {
        const errText = await res.text();
        let errorMsg = 'Failed to update task status.';
        try {
          const errJson = JSON.parse(errText);
          errorMsg = errJson.detail || errJson.message || errorMsg;
        } catch (e) {
          errorMsg = errText || errorMsg;
        }
        addToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('Error resolving quotation:', err);
      addToast('Network error resolving quotation.', 'error');
    } finally {
      setSubmittingQuote(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [baseUrl, taskId]);

  // SEO & metadata management
  useEffect(() => {
    const originalTitle = document.title;
    if (task) {
      document.title = `STMM - Chi tiết Tác vụ #${task.taskId}`;
    } else {
      document.title = `STMM - Chi tiết Tác vụ`;
    }

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute("content") : "";

    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    
    if (task) {
      metaDesc.setAttribute("content", `Chi tiết kỹ thuật, tiến độ thực hiện và lịch sử hoạt động của tác vụ vận hành số #${task.taskId} tại hệ thống STMM.`);
    } else {
      metaDesc.setAttribute("content", "Trang xem chi tiết kỹ thuật và cập nhật phân công, trạng thái tác vụ vận hành STMM.");
    }

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
        <button className="task-detail-btn task-detail-btn-secondary" onClick={onBack}>
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
  const isActiveTask = task.status !== 'Completed' && task.status !== 'Cancelled';
  const canCancelTask = ['Pending', 'PendingApproval', 'In_Progress'].includes(task.status);
  const canResolveQuotation = task.status === 'PendingApproval' && (task.requestId === null || task.requestPaidBy === 'Market');
  const quoteWarningTone = task.requestPaidBy === 'Market' ? 'market' : task.requestPaidBy === 'Vendor' ? 'vendor' : 'neutral';

  return (
    <main className="task-detail-container" id="task-detail-manager-main-view">

      {/* ── Top Header Navbar ── */}
      <nav className="detail-action-bar" id="task-detail-manager-action-bar">
        <button id="btn-manager-detail-back" className="task-detail-btn task-detail-btn-secondary back-btn" onClick={onBack}>
          <IconBack /> BACK TO LIST
        </button>
        <div className="action-buttons-group">
          {isActiveTask && (
            <>
              <button id="btn-manager-reassign-staff" className="task-detail-btn task-detail-btn-secondary" onClick={() => setShowAssignModal(true)}>
                <IconUser /> REASSIGN STAFF
              </button>
              {canCancelTask && (
                <button id="btn-manager-cancel-task" className="task-detail-btn task-detail-btn-danger" onClick={() => setShowStatusModal(true)}>
                  <IconCancel /> CANCEL TASK
                </button>
              )}
            </>
          )}
        </div>
      </nav>

      {task.status === 'PendingApproval' && task.requestId && (
        <div className={`manager-quote-warning manager-quote-warning-${quoteWarningTone}`}>
          <span className="warning-icon">{task.requestPaidBy === 'Market' ? 'i' : '!'}</span>
          <span className="warning-text">
            {task.requestPaidBy === 'Market' ? (
              <>
                This task quotation is paid by <strong>Market Management</strong>. Use the quotation approval panel on this page, or open{' '}
                <span 
                  id={`link-linked-request-warning-${task.requestId}`}
                  className="warning-link"
                  onClick={() => navigate('request-detail', task.requestId)}
                >
                  Request #REQ-{task.requestId}
                </span>{' '}
                for the linked request detail.
              </>
            ) : task.requestPaidBy === 'Vendor' ? (
              <>
                This quotation is waiting for the <strong>vendor</strong> linked to{' '}
                <span 
                  id={`link-linked-request-warning-${task.requestId}`}
                  className="warning-link"
                  onClick={() => navigate('request-detail', task.requestId)}
                >
                  Request #REQ-{task.requestId}
                </span>{' '}
                . Manager cannot approve it directly here.
              </>
            ) : (
              <>
                This quotation has no payer selected yet. Open{' '}
                <span 
                  id={`link-linked-request-warning-${task.requestId}`}
                  className="warning-link"
                  onClick={() => navigate('request-detail', task.requestId)}
                >
                  Request #REQ-{task.requestId}
                </span>{' '}
                to choose who pays before approval.
              </>
            )}
          </span>
        </div>
      )}

      <section className="detail-grid" id="task-detail-manager-grid">
        {/* ── LEFT COLUMN: TECHNICAL SPECS ── */}
        <section className="detail-left-column" id="task-detail-manager-left-col">
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
                    id={`link-linked-request-${task.requestId}`}
                    className="summary-val task-linked-record-link" 
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
        </section>

        {/* ── RIGHT COLUMN: WORKFLOW STATUS & HISTORY ── */}
        <aside className="detail-right-column" id="task-detail-manager-right-col">
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

          {canResolveQuotation && (
            <div className="spec-card quotation-approval-widget">
              <h3 className="spec-title quotation-approval-title">
                MATERIAL QUOTATION APPROVAL
              </h3>
              
              <div className="quotation-approval-copy">
                {task.requestId ? (
                  <p>
                    Task linked to <strong>Request #REQ-{task.requestId}</strong>. Cost is covered by <strong>Market Management</strong>.
                  </p>
                ) : (
                  <p>
                    General market infrastructure task. Cost is covered by <strong>Market Management</strong>.
                  </p>
                )}
                <p>
                  Total estimated cost: <strong className="quotation-total">{formatCurrency(materialsTotal)}</strong>
                </p>
              </div>

              <div className="quotation-actions">
                <button
                  disabled={submittingQuote}
                  onClick={() => handleResolveQuote(true)}
                  className="quotation-action-btn quotation-approve-btn"
                >
                  {submittingQuote ? 'Processing...' : 'Approve Quotation'}
                </button>
                <button
                  disabled={submittingQuote}
                  onClick={() => handleResolveQuote(false)}
                  className="quotation-action-btn quotation-reject-btn"
                >
                  {submittingQuote ? 'Processing...' : 'Reject Quotation'}
                </button>
              </div>
            </div>
          )}

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
        </aside>
      </section>

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
          mode="cancel"
          baseUrl={baseUrl}
          onClose={() => setShowStatusModal(false)}
          onSuccess={(updated) => {
            setShowStatusModal(false);
            setTask(updated);
          }}
          addToast={addToast}
        />
      )}
      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-box task-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{confirmModal.title}</h3>
              <button className="modal-close" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>&times;</button>
            </div>
            <div className="modal-body task-confirm-body">
              {confirmModal.message}
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="task-detail-btn task-detail-btn-secondary" 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                NO
              </button>
              <button 
                type="button" 
                className={`task-detail-btn ${confirmModal.type === 'danger' ? 'task-detail-btn-danger-solid' : 'task-detail-btn-primary'}`} 
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
              >
                YES
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
