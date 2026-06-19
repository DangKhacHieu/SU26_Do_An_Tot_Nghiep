import React, { useState, useEffect } from 'react';
import './CreateTaskModal.css';

export default function CreateTaskModal({ userId, baseUrl, onClose, onSuccess, addToast }) {
  const [taskType, setTaskType] = useState('Repair');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [areaId, setAreaId] = useState('');

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
      requestId: null,
      issueId: null
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
          <button className="modal-close" onClick={onClose}>&times;</button>
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
                className="form-control"
                value={taskType}
                onChange={(e) => {
                  setTaskType(e.target.value);
                  setAreaId('');
                  setFormErrors({});
                }}
                disabled={submitting}
              >
                <option value="Repair">Repair</option>
                <option value="Maintenance">Maintenance</option>
                <option value="UtilityReading">Utility Reading</option>
                <option value="CashCollection">Cash Collection</option>
              </select>
            </div>

            {/* Title */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label required-field">TASK LABEL</label>
              <input
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
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              CANCEL
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'CREATING...' : 'SAVE SUBMISSION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
