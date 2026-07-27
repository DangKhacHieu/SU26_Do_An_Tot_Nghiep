import React, { useState } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import './UpdateTaskStatusModal.css';

export default function UpdateTaskStatusModal({ taskId, currentStatus, mode = 'status', baseUrl, onClose, onSuccess, addToast }) {
  const isCancelMode = mode === 'cancel';
  const [newStatus, setNewStatus] = useState(isCancelMode ? 'Cancelled' : '');
  const [submitting, setSubmitting] = useState(false);

  // Determine allowed transitions
  // oldStatus == "Pending" -> "Cancelled"
  // oldStatus == "PendingApproval" -> "In_Progress" or "Cancelled"
  // oldStatus == "In_Progress" -> "Cancelled"
  const allowedOptions = [];
  const oldStatus = currentStatus || 'Pending';

  if (isCancelMode) {
    if (['Pending', 'PendingApproval', 'In_Progress'].includes(oldStatus)) {
      allowedOptions.push({ value: 'Cancelled', label: 'Cancel Task' });
    }
  } else if (oldStatus === 'Pending') {
    allowedOptions.push({ value: 'Cancelled', label: 'Cancel Task' });
  } else if (oldStatus === 'PendingApproval') {
    allowedOptions.push({ value: 'In_Progress', label: 'Approve Quotation & Start' });
    allowedOptions.push({ value: 'Cancelled', label: 'Reject Quotation & Cancel' });
  } else if (oldStatus === 'In_Progress') {
    allowedOptions.push({ value: 'Cancelled', label: 'Cancel Task' });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus) {
      addToast('Please select a target status.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/api/manager/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newStatus: newStatus })
      });

      if (res.ok) {
        addToast(isCancelMode ? 'Task cancelled successfully!' : `Task status updated to ${newStatus} successfully!`, 'success');
        const updatedTask = await res.json();
        onSuccess(updatedTask);
      } else {
        const errText = await res.text();
        addToast(errText || 'Failed to update task status.', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      addToast('Network error. Failed to update status.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-head">
          <h3>{isCancelMode ? 'Cancel Task' : 'Update Task Status'}</h3>
          <button id="btn-status-close" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="status-current-badge-wrap">
              <span className="status-current-label">CURRENT STATUS:</span>
              <span className={`status-badge-val status-${oldStatus.toLowerCase()}`}>
                {oldStatus.replace('_', ' ')}
              </span>
            </div>

            {isCancelMode && allowedOptions.length > 0 && (
              <div className="status-cancel-summary">
                This action will move the task from <strong>{oldStatus.replace('_', ' ')}</strong> to <strong>Cancelled</strong>.
              </div>
            )}

            {allowedOptions.length === 0 ? (
              <div className="status-no-transitions-msg">
                No state transitions are allowed from <strong>{oldStatus.replace('_', ' ')}</strong> state.
              </div>
            ) : !isCancelMode ? (
              <div className="form-group">
                <label className="form-label required-field">TARGET STATUS</label>
                <div className="flat-radio-buttons-container">
                  {allowedOptions.map((opt) => {
                    const isSelected = newStatus === opt.value;
                    return (
                      <label 
                        key={opt.value} 
                        className={`flat-status-option ${isSelected ? 'is-active' : ''}`}
                      >
                        <input
                          id={`radio-status-${opt.value}`}
                          type="radio"
                          name="targetStatus"
                          value={opt.value}
                          checked={isSelected}
                          onChange={() => setNewStatus(opt.value)}
                          disabled={submitting}
                          className="flat-radio-input-hidden"
                        />
                        <span className="flat-radio-circle"></span>
                        <span className="flat-radio-label-text">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
          <div className="modal-foot">
            <button id="btn-status-cancel" type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              CANCEL
            </button>
            <button 
              id="btn-status-submit"
              type="submit" 
              className="btn-primary" 
              disabled={submitting || allowedOptions.length === 0 || !newStatus}
            >
              {submitting ? (isCancelMode ? 'CANCELLING...' : 'UPDATING...') : (isCancelMode ? 'CANCEL TASK' : 'UPDATE STATUS')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
