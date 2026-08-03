import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthHeaders } from '../../utils/authHeaders';
import './UpdateTaskStatusModal.css';

export default function UpdateTaskStatusModal({ taskId, currentStatus, mode = 'status', baseUrl, onClose, onSuccess, addToast }) {
  const { t } = useTranslation();
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
      allowedOptions.push({ value: 'Cancelled', label: t('updatetaskstatusmodal.cancel_task') });
    }
  } else if (oldStatus === 'Pending') {
    allowedOptions.push({ value: 'Cancelled', label: t('updatetaskstatusmodal.cancel_task') });
  } else if (oldStatus === 'PendingApproval') {
    allowedOptions.push({ value: 'In_Progress', label: t('updatetaskstatusmodal.approve_and_start') });
    allowedOptions.push({ value: 'Cancelled', label: t('updatetaskstatusmodal.reject_and_cancel') });
  } else if (oldStatus === 'In_Progress') {
    allowedOptions.push({ value: 'Cancelled', label: t('updatetaskstatusmodal.cancel_task') });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus) {
      addToast(t('updatetaskstatusmodal.status_required'), 'warning');
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
        addToast(isCancelMode
          ? t('updatetaskstatusmodal.cancelled_successfully')
          : t('updatetaskstatusmodal.updated_successfully', { status: newStatus }), 'success');
        const updatedTask = await res.json();
        onSuccess(updatedTask);
      } else {
        const errText = await res.text();
        addToast(errText || t('updatetaskstatusmodal.update_failed'), 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      addToast(t('updatetaskstatusmodal.network_error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-head">
          <h3>{isCancelMode ? t('updatetaskstatusmodal.cancel_task') : t('updatetaskstatusmodal.title')}</h3>
          <button id="btn-status-close" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="status-current-badge-wrap">
              <span className="status-current-label">{t('updatetaskstatusmodal.current_status')}</span>
              <span className={`status-badge-val status-${oldStatus.toLowerCase()}`}>
                {oldStatus.replace('_', ' ')}
              </span>
            </div>

            {isCancelMode && allowedOptions.length > 0 && (
              <div className="status-cancel-summary">
                {t('updatetaskstatusmodal.cancel_summary', {
                  currentStatus: oldStatus.replace('_', ' '),
                  targetStatus: 'Cancelled',
                })}
              </div>
            )}

            {allowedOptions.length === 0 ? (
              <div className="status-no-transitions-msg">
                {t('updatetaskstatusmodal.no_transitions', { status: oldStatus.replace('_', ' ') })}
              </div>
            ) : !isCancelMode ? (
              <div className="form-group">
                <label className="form-label required-field">{t('updatetaskstatusmodal.target_status')}</label>
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
              {t('updatetaskstatusmodal.cancel')}
            </button>
            <button 
              id="btn-status-submit"
              type="submit" 
              className="btn-primary" 
              disabled={submitting || allowedOptions.length === 0 || !newStatus}
            >
              {submitting
                ? (isCancelMode ? t('updatetaskstatusmodal.cancelling') : t('updatetaskstatusmodal.updating'))
                : (isCancelMode ? t('updatetaskstatusmodal.cancel_task') : t('updatetaskstatusmodal.update_status'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
