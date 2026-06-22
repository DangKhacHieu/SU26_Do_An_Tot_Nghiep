import React, { useState } from 'react';
import './UpdateTaskStatusModal.css';

export default function UpdateTaskStatusModal({ taskId, currentStatus, baseUrl, onClose, onSuccess, addToast }) {
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Determine allowed transitions
  // oldStatus == "Pending" -> "Cancelled"
  // oldStatus == "PendingApproval" -> "In_Progress" or "Cancelled"
  // oldStatus == "In_Progress" -> "Cancelled"
  const allowedOptions = [];
  const oldStatus = currentStatus || 'Pending';

  if (oldStatus === 'Pending') {
    allowedOptions.push({ value: 'Cancelled', label: 'Cancel Task' });
  } else if (oldStatus === 'PendingApproval') {
    allowedOptions.push({ value: 'In_Progress', label: 'Approve Quotation & Start' });
    allowedOptions.push({ value: 'Pending', label: 'Reject Quotation & Re-evaluate' });
    allowedOptions.push({ value: 'Cancelled', label: 'Cancel Task' });
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus: newStatus })
      });

      if (res.ok) {
        addToast(`Task status updated to ${newStatus} successfully!`, 'success');
        const updatedTask = await res.json();
        // Even though status notes aren't saved in the db (no column), we log them in the console
        if (statusNotes.trim()) {
          console.log(`Status transition note: ${statusNotes}`);
        }
        onSuccess(updatedTask);
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
          <h3>Update Task Status</h3>
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

            {allowedOptions.length === 0 ? (
              <div className="status-no-transitions-msg">
                No state transitions are allowed from <strong>{oldStatus.replace('_', ' ')}</strong> state.
              </div>
            ) : (
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
            )}

            {allowedOptions.length > 0 && (
              <div className="form-group">
                <label className="form-label">STATUS NOTES</label>
                <textarea
                  id="textarea-status-notes"
                  className="form-control"
                  rows="3"
                  placeholder="Provide reason for this status update..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  disabled={submitting}
                  style={{ resize: 'none' }}
                />
              </div>
            )}
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
              {submitting ? 'UPDATING...' : 'UPDATE STATUS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
