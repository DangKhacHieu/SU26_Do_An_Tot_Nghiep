import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import './TaskDetailManager.css';
import AssignStaffModal from './AssignStaffModal';
import UpdateTaskStatusModal from './UpdateTaskStatusModal';
import UtilityChecklistManager from './UtilityChecklistManager';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`
});

/* ── Inline Icons ── */
const IconBack = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconUser = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconCancel = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;

export default function TaskDetailManager({ taskId, baseUrl, onBack, addToast, navigate }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US';

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
      title: approve ? t('taskdetailmanager.approve_quotation') : t('taskdetailmanager.return_for_revision'),
      message: approve 
        ? t('taskdetailmanager.approve_confirmation')
        : t('taskdetailmanager.return_confirmation'),
      onConfirm: () => executeResolveQuote(approve)
    });
  };

  const executeResolveQuote = async (approve) => {
    setSubmittingQuote(true);
    try {
      const res = await fetch(`${baseUrl}/api/manager/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newStatus: approve ? 'In_Progress' : 'Pending' })
      });

      if (res.ok) {
        addToast(approve
          ? t('taskdetailmanager.quotation_approved')
          : t('taskdetailmanager.quotation_returned'), 'success');
        const updatedTask = await res.json();
        setTask(updatedTask);
      } else {
        const errText = await res.text();
        let errorMsg = t('taskdetailmanager.update_status_failed');
        try {
          const errJson = JSON.parse(errText);
          errorMsg = errJson.detail || errJson.message || errorMsg;
        } catch {
          errorMsg = errText || errorMsg;
        }
        addToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('Error resolving quotation:', err);
      addToast(t('taskdetailmanager.resolve_network_error'), 'error');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const fetchTaskDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/manager/tasks/${taskId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      } else {
        addToast(t('taskdetailmanager.load_failed'), 'error');
      }
    } catch (err) {
      console.error('Error fetching task details:', err);
      addToast(t('taskdetailmanager.load_network_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, baseUrl, taskId, t]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  // SEO & metadata management
  useEffect(() => {
    const originalTitle = document.title;
    if (task) {
      document.title = t('taskdetailmanager.stmm_task_details_tasktaskid', { taskId: task.taskId });
    } else {
      document.title = t('taskdetailmanager.stmm_task_details');
    }

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute("content") : "";

    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    
    if (task) {
      metaDesc.setAttribute("content", t('taskdetailmanager.technical_details_implementation_progress', { taskId: task.taskId }));
    } else {
      metaDesc.setAttribute("content", t('taskdetailmanager.page_to_view_technical'));
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
  }, [task, t]);

  if (loading) {
    return (
      <div className="task-detail-loading">
        <div className="spinner"></div>
        <p>{t('taskdetailmanager.loading')}</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-detail-error">
        <p>{t('taskdetailmanager.not_found')}</p>
        <button className="task-detail-btn task-detail-btn-secondary" onClick={onBack}>
          <IconBack /> {t('taskdetailmanager.back_to_list')}
        </button>
      </div>
    );
  }



  const formatTaskType = (type) => {
    if (type === 'UtilityReading') return t('taskdetailmanager.utility_reading');
    if (type === 'Repair') return t('taskdetailmanager.repair');
    return type;
  };

  const formatStatus = (status) => {
    if (status === 'PendingApproval') return t('taskdetailmanager.pending_approval');
    if (status === 'In_Progress') return t('taskdetailmanager.in_progress');
    if (status === 'Pending') return t('taskdetailmanager.pending');
    if (status === 'Completed') return t('taskdetailmanager.completed');
    if (status === 'Cancelled') return t('taskdetailmanager.cancelled');
    return status;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '0 VNĐ';
    return new Intl.NumberFormat(locale).format(val) + ' VNĐ';
  };



  // Materials total
  const materialsTotal = (task.materials || []).reduce((acc, m) => acc + (m.amount || 0), 0);
  const isActiveTask = task.status !== 'Completed' && task.status !== 'Cancelled';
  const canCancelTask = ['Pending', 'PendingApproval', 'In_Progress'].includes(task.status);
  const canResolveQuotation = task.status === 'PendingApproval' && task.requestId === null;
  const quoteWarningTone = task.requestPaidBy === 'Market' ? 'market' : task.requestPaidBy === 'Vendor' ? 'vendor' : 'neutral';

  return (
    <main className="task-detail-container" id="task-detail-manager-main-view">

      {/* ── Top Header Navbar ── */}
      <nav className="detail-action-bar" id="task-detail-manager-action-bar">
        <button id="btn-manager-detail-back" className="task-detail-btn task-detail-btn-secondary back-btn" onClick={onBack}>
          <IconBack /> {t('taskdetailmanager.back_to_list')}
        </button>
        <div className="action-buttons-group">
          {isActiveTask && (
            <>
              <button id="btn-manager-reassign-staff" className="task-detail-btn task-detail-btn-secondary" onClick={() => setShowAssignModal(true)}>
                <IconUser /> {t('taskdetailmanager.reassign_staff')}
              </button>
              {canCancelTask && (
                <button id="btn-manager-cancel-task" className="task-detail-btn task-detail-btn-danger" onClick={() => setShowStatusModal(true)}>
                  <IconCancel /> {t('taskdetailmanager.cancel_task')}
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
                {t('taskdetailmanager.market_paid_prefix')} <strong>{t('taskdetailmanager.market_management')}</strong>. {t('taskdetailmanager.open_request_prefix')}{' '}
                <span 
                  id={`link-linked-request-warning-${task.requestId}`}
                  className="warning-link"
                  onClick={() => navigate('request-detail', task.requestId)}
                >
                  Request #REQ-{task.requestId}
                </span>{' '}
                {' '}{t('taskdetailmanager.open_request_suffix')}
              </>
            ) : task.requestPaidBy === 'Vendor' ? (
              <>
                {t('taskdetailmanager.vendor_waiting_prefix')} <strong>{t('taskdetailmanager.vendor')}</strong> {t('taskdetailmanager.linked_to')}{' '}
                <span 
                  id={`link-linked-request-warning-${task.requestId}`}
                  className="warning-link"
                  onClick={() => navigate('request-detail', task.requestId)}
                >
                  Request #REQ-{task.requestId}
                </span>{' '}
                . {t('taskdetailmanager.manager_cannot_approve')}
              </>
            ) : (
              <>
                {t('taskdetailmanager.no_payer_prefix')}{' '}
                <span 
                  id={`link-linked-request-warning-${task.requestId}`}
                  className="warning-link"
                  onClick={() => navigate('request-detail', task.requestId)}
                >
                  Request #REQ-{task.requestId}
                </span>{' '}
                {' '}{t('taskdetailmanager.no_payer_suffix')}
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
            <h3 className="spec-title">{t('taskdetailmanager.task_specifications')}</h3>
            
            <div className="summary-fields-grid">
              <div className="summary-field">
                <span className="summary-label">{t('taskdetailmanager.task_label')}</span>
                <span className="summary-val text-bold">{task.title}</span>
              </div>
              <div className="summary-field">
                <span className="summary-label">{t('taskdetailmanager.task_type')}</span>
                <span className="summary-val task-type-badge">{formatTaskType(task.taskType)}</span>
              </div>
              <div className="summary-field">
                <span className="summary-label">{t('taskdetailmanager.work_area')}</span>
                <span className="summary-val">{task.areaName || t('taskdetailmanager.general_area')}</span>
              </div>
              <div className="summary-field">
                <span className="summary-label">{t('taskdetailmanager.coordinator')}</span>
                <span className="summary-val">{t('taskdetailmanager.system_manager')}</span>
              </div>
              {task.requestId && (
                <div className="summary-field">
                  <span className="summary-label">{t('taskdetailmanager.linked_request')}</span>
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
            <h3 className="spec-title">{t('taskdetailmanager.operational_specifications')}</h3>
            <p className="spec-desc-text">{task.description || t('taskdetailmanager.no_description')}</p>
          </div>

          {task.taskType === 'UtilityReading' ? (
            <UtilityChecklistManager taskId={task.taskId} baseUrl={baseUrl} />
          ) : null}

          {/* Quotation Materials */}
          {task.taskType === 'Repair' && (
            <div className="spec-card">
              <h3 className="spec-title">{t('taskdetailmanager.materials_quotation')}</h3>
              {(!task.materials || task.materials.length === 0) ? (
                <div className="materials-empty-state">
                  {t('taskdetailmanager.no_materials')}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="materials-table">
                    <thead>
                      <tr>
                        <th>{t('taskdetailmanager.item_name')}</th>
                        <th style={{ textAlign: 'center' }}>{t('taskdetailmanager.quantity')}</th>
                        <th style={{ textAlign: 'right' }}>{t('taskdetailmanager.unit_price')}</th>
                        <th style={{ textAlign: 'right' }}>{t('taskdetailmanager.total_amount')}</th>
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
                        <td colSpan="3" style={{ textAlign: 'right', fontWeight: '700' }}>{t('taskdetailmanager.subtotal')}</td>
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
          {task.taskType === 'Repair' && (
            <div className="spec-card">
              <h3 className="spec-title">{t('taskdetailmanager.evidence')}</h3>
              <div className="evidence-photos-grid">
                <div className="evidence-photo-box">
                  <span className="evidence-photo-label">{t('taskdetailmanager.before_repair')}</span>
                  {task.imageBeforeUrl ? (
                    <img src={task.imageBeforeUrl} alt={t('taskdetailmanager.before_repair_evidence')} className="evidence-img" />
                  ) : (
                    <div className="evidence-photo-placeholder">
                      <span>{t('taskdetailmanager.no_before_photo')}</span>
                    </div>
                  )}
                </div>
                <div className="evidence-photo-box">
                  <span className="evidence-photo-label">{t('taskdetailmanager.after_completion')}</span>
                  {task.imageAfterUrl ? (
                    <img src={task.imageAfterUrl} alt={t('taskdetailmanager.after_repair_evidence')} className="evidence-img" />
                  ) : (
                    <div className="evidence-photo-placeholder">
                      <span>{t('taskdetailmanager.no_after_photo')}</span>
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
            <span className="status-widget-title">{t('taskdetailmanager.current_status')}</span>
            <div className={`status-widget-badge status-${task.status.toLowerCase()}`}>
              <span className="status-widget-dot"></span>
              {formatStatus(task.status)}
            </div>
            
            <div className="assignee-card-small">
              <div className="assignee-avatar-small">
                {task.assignedToName ? task.assignedToName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
              </div>
              <div className="assignee-details-small">
                <span className="assignee-role-label">{t('taskdetailmanager.assigned_staff')}</span>
                <span className="assignee-name-val">{task.assignedToName || t('taskdetailmanager.unassigned')}</span>
              </div>
            </div>

            {task.actualCost !== null && task.actualCost !== undefined && (
              <div className="cost-summary-box">
                <span className="cost-summary-label">{t('taskdetailmanager.actual_cost')}</span>
                <span className="cost-summary-val">{formatCurrency(task.actualCost)}</span>
              </div>
            )}
          </div>

          {canResolveQuotation && (
            <div className="spec-card quotation-approval-widget">
              <h3 className="spec-title quotation-approval-title">
                {t('taskdetailmanager.quotation_approval')}
              </h3>
              
              <div className="quotation-approval-copy">
                {task.requestId ? (
                  <p>
                    {t('taskdetailmanager.linked_task_cost_prefix')} <strong>Request #REQ-{task.requestId}</strong>. {t('taskdetailmanager.market_cost')}
                  </p>
                ) : (
                  <p>
                    {t('taskdetailmanager.general_market_cost')}
                  </p>
                )}
                <p>
                  {t('taskdetailmanager.estimated_cost')}: <strong className="quotation-total">{formatCurrency(materialsTotal)}</strong>
                </p>
              </div>

              <div className="quotation-actions">
                <button
                  disabled={submittingQuote}
                  onClick={() => handleResolveQuote(true)}
                  className="quotation-action-btn quotation-approve-btn"
                >
                  {submittingQuote ? t('taskdetailmanager.processing') : t('taskdetailmanager.approve_quotation')}
                </button>
                <button
                  disabled={submittingQuote}
                  onClick={() => handleResolveQuote(false)}
                  className="quotation-action-btn quotation-reject-btn"
                >
                  {submittingQuote ? t('taskdetailmanager.processing') : t('taskdetailmanager.return_for_revision')}
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Activity Timeline */}
          <div className="spec-card">
            <h3 className="spec-title">{t('taskdetailmanager.activity_history')}</h3>
            <div className="timeline-container">
              
              {/* Event 1: Created */}
              <div className="timeline-item is-done">
                <div className="timeline-badge"></div>
                <div className="timeline-content">
                  <span className="timeline-date">{formatDate(task.createdAt)}</span>
                  <span className="timeline-event-title">{t('taskdetailmanager.task_created')}</span>
                  <p className="timeline-event-desc">
                    {t('taskdetailmanager.task_created_description')}
                  </p>
                </div>
              </div>

              {/* Event 2: Staff Assigned */}
              <div className="timeline-item is-done">
                <div className="timeline-badge"></div>
                <div className="timeline-content">
                  <span className="timeline-date">{formatDate(task.createdAt)}</span>
                  <span className="timeline-event-title">{t('taskdetailmanager.staff_assigned')}</span>
                  <p className="timeline-event-desc">
                    {t('taskdetailmanager.staff_assigned_prefix')} <strong>{task.assignedToName || t('taskdetailmanager.unassigned')}</strong>.
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
                      {task.taskType === 'UtilityReading'
                        ? t('taskdetailmanager.meter_readings_completed')
                        : t('taskdetailmanager.task_completed')}
                    </span>
                    <p className="timeline-event-desc">
                      {task.completionNotes ? (
                        <>
                          <strong>{t('taskdetailmanager.staff_note')}:</strong> "{task.completionNotes}"
                        </>
                      ) : (
                        t('taskdetailmanager.completed_description')
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
                    <span className="timeline-event-title">{t('taskdetailmanager.task_cancelled')}</span>
                    <p className="timeline-event-desc">
                      {t('taskdetailmanager.cancelled_description')}
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
                {t('taskdetailmanager.no')}
              </button>
              <button 
                type="button" 
                className={`task-detail-btn ${confirmModal.type === 'danger' ? 'task-detail-btn-danger-solid' : 'task-detail-btn-primary'}`} 
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
              >
                {t('taskdetailmanager.yes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
