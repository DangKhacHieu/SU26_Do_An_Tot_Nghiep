import React, { useState, useEffect } from 'react';
import './CreateTaskModal.css';

export default function CreateTaskModal({ userId, baseUrl, onClose, onSuccess, addToast, preFilledIssueId = null, preFilledTitle = '', preFilledDescription = '' }) {
  const [taskType, setTaskType] = useState('Repair');
  const [title, setTitle] = useState(preFilledTitle || '');
  const [description, setDescription] = useState(preFilledDescription || '');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [areaId, setAreaId] = useState('');

  // Link to Request states
  const [linkToRequest, setLinkToRequest] = useState(false);
  const [requests, setRequests] = useState([]);
  const [requestId, setRequestId] = useState('');
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Dropdowns lists
  const [staffs, setStaffs] = useState([]);
  const [areas, setAreas] = useState([]);
  
  // Loading states
  const [loadingStaffs, setLoadingStaffs] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchStaffs = async () => {
      setLoadingStaffs(true);
      try {
        const res = await fetch(`${baseUrl}/api/manager/users?roleName=Staff`);
        if (res.ok) {
          const data = await res.json();
          // Filter only active staff members
          setStaffs(data.filter(u => u.status === 'Active') || []);
        } else {
          addToast('Cannot load staff list.', 'error');
        }
      } catch (err) {
        console.error('Error fetching staff list:', err);
      } finally {
        setLoadingStaffs(false);
      }
    };

    const fetchAreas = async () => {
      setLoadingAreas(true);
      try {
        const res = await fetch(`${baseUrl}/api/Areas`);
        if (res.ok) {
          const data = await res.json();
          setAreas(data || []);
        } else {
          addToast('Cannot load market areas.', 'error');
        }
      } catch (err) {
        console.error('Error fetching areas:', err);
      } finally {
        setLoadingAreas(false);
      }
    };

    fetchStaffs();
    fetchAreas();
  }, [baseUrl]);

  // Load pending requests when linkToRequest is checked
  useEffect(() => {
    if (linkToRequest && requests.length === 0) {
      const fetchRequests = async () => {
        setLoadingRequests(true);
        try {
          const res = await fetch(`${baseUrl}/api/manager/requests?status=Pending&requestType=FacilityIssue&pageSize=100`);
          if (res.ok) {
            const data = await res.json();
            setRequests(data.items || data.Items || []);
          } else {
            addToast('Cannot load pending requests list.', 'error');
          }
        } catch (err) {
          console.error('Error fetching requests:', err);
        } finally {
          setLoadingRequests(false);
        }
      };
      fetchRequests();
    }
  }, [linkToRequest, baseUrl, requests.length]);

  const validate = () => {
    const errors = {};
    if (!title.trim()) {
      errors.title = 'Title is required.';
    } else if (title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters.';
    }

    if (!assignedToUserId) {
      errors.assignedToUserId = 'Please assign this task to a staff member.';
    }

    if (taskType === 'UtilityReading' && !areaId) {
      errors.areaId = 'Please select a market area for utility reading.';
    }

    if (linkToRequest && (taskType === 'Repair' || taskType === 'Maintenance') && !requestId) {
      errors.requestId = 'Please select a customer request to link.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    
    const body = {
      assignedToUserId: parseInt(assignedToUserId),
      taskType: taskType,
      title: title.trim(),
      description: description.trim() || null,
      areaId: taskType === 'UtilityReading' ? parseInt(areaId) : null,
      requestId: (linkToRequest && (taskType === 'Repair' || taskType === 'Maintenance') && requestId) ? parseInt(requestId) : null,
      issueId: preFilledIssueId ? parseInt(preFilledIssueId) : null
    };

    try {
      const res = await fetch(`${baseUrl}/api/manager/tasks?userId=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        addToast('Task created successfully!', 'success');
        const data = await res.json();
        onSuccess(data);
      } else {
        const errText = await res.text();
        addToast(errText || 'Failed to create task.', 'error');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      addToast('Network error. Failed to create task.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-head">
          <h3>Create New Task</h3>
          <button id="btn-create-task-close" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <h4 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              TASK ENTRY FORM
            </h4>

            {/* Task Type */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label required-field">TASK TYPE</label>
              <select
                id="select-create-task-type"
                className="form-control"
                value={taskType}
                onChange={(e) => {
                  setTaskType(e.target.value);
                  setAreaId('');
                  setLinkToRequest(false);
                  setRequestId('');
                  setFormErrors({});
                }}
                disabled={submitting}
              >
                <option value="Repair">Repair</option>
                <option value="Maintenance">Maintenance</option>
                <option value="UtilityReading">Utility Reading</option>
              </select>
            </div>

            {/* Link to Request (Only for Repair or Maintenance tasks) */}
            {preFilledIssueId ? (
              <div style={{ marginBottom: '16px', padding: '12px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e40af', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  LINKED INFRASTRUCTURE ISSUE
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a8a', marginTop: '4px', display: 'inline-block' }}>
                  📍 Issue ID: #{preFilledIssueId}
                </span>
              </div>
            ) : (
              (taskType === 'Repair' || taskType === 'Maintenance') && (
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column' }}>
                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      cursor: 'pointer', 
                      fontWeight: '700', 
                      fontSize: '12px', 
                      color: '#475569',
                      userSelect: 'none',
                      letterSpacing: '0.5px',
                      margin: '0',
                      padding: '4px 0'
                    }}
                  >
                    <input
                      id="checkbox-link-request"
                      type="checkbox"
                      checked={linkToRequest}
                      onChange={(e) => {
                        setLinkToRequest(e.target.checked);
                        if (!e.target.checked) setRequestId('');
                      }}
                      disabled={submitting}
                      style={{
                        width: '16px',
                        height: '16px',
                        margin: '0',
                        flexShrink: 0,
                        cursor: 'pointer',
                        accentColor: '#2563eb'
                      }}
                    />
                    LINK THIS TASK TO A CUSTOMER REQUEST
                  </label>

                  {linkToRequest && (
                    <div style={{ marginTop: '10px', paddingLeft: '18px', borderLeft: '3px solid #2563eb' }}>
                      <label className="form-label required-field">SELECT REQUEST</label>
                      <select
                        id="select-create-task-request"
                        className={`form-control ${formErrors.requestId ? 'is-error' : ''}`}
                        value={requestId}
                        onChange={(e) => setRequestId(e.target.value)}
                        disabled={loadingRequests || submitting}
                        style={{ marginTop: '4px' }}
                      >
                        <option value="">-- Select Pending Request --</option>
                        {requests.map(r => (
                          <option key={r.requestId} value={r.requestId}>
                            #REQ-{r.requestId}: {r.title} ({r.stallCode ? `Stall ${r.stallCode}` : 'No Stall'})
                          </option>
                        ))}
                      </select>
                      {loadingRequests && <span className="helper-text">Loading requests...</span>}
                      {formErrors.requestId && <span className="modal-confirm-hint" style={{ color: 'var(--color-danger)' }}>{formErrors.requestId}</span>}
                    </div>
                  )}
                </div>
              )
            )}

            {/* Title */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label required-field">TASK LABEL</label>
              <input
                id="input-create-task-title"
                type="text"
                className={`form-control ${formErrors.title ? 'is-error' : ''}`}
                placeholder="Enter task name or summary..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
              />
              {formErrors.title && <span className="modal-confirm-hint" style={{ color: 'var(--color-danger)' }}>{formErrors.title}</span>}
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">OPERATIONAL DESCRIPTION</label>
              <textarea
                id="textarea-create-task-desc"
                className="form-control"
                rows="4"
                placeholder="Provide detailed technical constraints..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                style={{ resize: 'none' }}
              />
            </div>

            {/* Assigned Staff */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label required-field">ASSIGN TO STAFF</label>
              <select
                id="select-create-task-staff"
                className={`form-control ${formErrors.assignedToUserId ? 'is-error' : ''}`}
                value={assignedToUserId}
                onChange={(e) => setAssignedToUserId(e.target.value)}
                disabled={loadingStaffs || submitting}
              >
                <option value="">-- Select Active Staff --</option>
                {staffs.map(s => (
                  <option key={s.userId} value={s.userId}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
              {loadingStaffs && <span className="helper-text">Loading staffs...</span>}
              {formErrors.assignedToUserId && <span className="modal-confirm-hint" style={{ color: 'var(--color-danger)' }}>{formErrors.assignedToUserId}</span>}
            </div>

            {/* Area (Only for UtilityReading) */}
            {taskType === 'UtilityReading' && (
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label required-field">MARKET AREA</label>
                <select
                  id="select-create-task-area"
                  className={`form-control ${formErrors.areaId ? 'is-error' : ''}`}
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  disabled={loadingAreas || submitting}
                >
                  <option value="">-- Select Area to Measure --</option>
                  {areas.map(a => (
                    <option key={a.areaId} value={a.areaId}>
                      {a.name} ({a.description || 'No Description'})
                    </option>
                  ))}
                </select>
                {loadingAreas && <span className="helper-text">Loading areas...</span>}
                {formErrors.areaId && <span className="modal-confirm-hint" style={{ color: 'var(--color-danger)' }}>{formErrors.areaId}</span>}
              </div>
            )}
          </div>
          <div className="modal-foot">
            <button id="btn-create-task-cancel" type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              CANCEL
            </button>
            <button id="btn-create-task-submit" type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'CREATING...' : 'SAVE SUBMISSION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
